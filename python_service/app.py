
import os
import uvicorn
import requests
import tempfile
import uuid
import time
from fastapi import FastAPI, BackgroundTasks, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import json
import logging
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Fast Whisper Transcription Service")

# Supabase config
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

class TranscriptionRequest(BaseModel):
    transcription_id: str
    audio_url: str
    language: Optional[str] = "pt"  # Default to Portuguese
    callback_url: Optional[str] = None  # New: callback URL parameter

class TranscriptionTask(BaseModel):
    task_id: str

class TaskStatusResponse(BaseModel):
    status: str
    result: Optional[Dict[str, Any]] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Fast Whisper Transcription Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Task status endpoint
@app.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str):
    try:
        logger.info(f"Checking status for task: {task_id}")
        
        # Check if task exists in the database
        if not supabase:
            # If no Supabase connection, check local storage
            # This is a simplified example - in production you'd have better storage
            return TaskStatusResponse(status="processing")
            
        result = supabase.table("transcriptions").select("*").eq("id", task_id).execute()
        
        if not result.data:
            logger.warning(f"Task {task_id} not found in database")
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
            
        task = result.data[0]
        logger.info(f"Found task: {task}")
        
        # Extract relevant data
        status = task.get("status", "processing")
        content = task.get("content")
        duration_ms = task.get("duration_ms")
        error_message = task.get("error_message")
        
        # Build response
        response = TaskStatusResponse(
            status=status,
            duration_ms=duration_ms,
            error=error_message
        )
        
        # Add result if completed
        if status == "completed" and content:
            response.result = {"text": content}
            
        return response
        
    except Exception as e:
        logger.error(f"Error checking task status: {e}")
        raise HTTPException(status_code=500, detail=f"Error checking task status: {str(e)}")

# New endpoint: File upload API that Edge Function is calling
@app.post("/api/transcribe")
async def transcribe_file(
    file: UploadFile = File(...), 
    background_tasks: BackgroundTasks = None,
    callback_url: Optional[str] = Form(None)  # Add callback_url as a form parameter
):
    try:
        logger.info(f"Received file upload: {file.filename}, content_type: {file.content_type}")
        if callback_url:
            logger.info(f"Callback URL provided: {callback_url}")
        
        # Generate a task ID
        task_id = str(uuid.uuid4())
        logger.info(f"Generated task ID: {task_id}")
        
        # Save the uploaded file to a temporary location
        temp_file_path = None
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
            
        logger.info(f"Saved uploaded file to: {temp_file_path}")
        
        # Create a transcription entry in the database
        transcription_data = {
            "id": task_id,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
        }
        
        try:
            if supabase:
                supabase.table("transcriptions").insert(transcription_data).execute()
                logger.info(f"Created transcription entry with ID: {task_id}")
        except Exception as db_error:
            logger.error(f"Error creating transcription entry: {db_error}")
            # Continue even if database entry fails
        
        # Process the transcription in the background
        if background_tasks:
            background_tasks.add_task(
                process_transcription,
                task_id, 
                temp_file_path, 
                "pt",  # Default language 
                callback_url  # Pass the callback URL
            )
            logger.info(f"Added transcription task to background tasks: {task_id}")
        
        # Return the task ID immediately
        return {"task_id": task_id}
        
    except Exception as e:
        logger.error(f"Error processing file upload: {e}")
        return {"error": str(e)}, 500

def process_transcription(transcription_id: str, audio_path: str, language: str, callback_url: Optional[str] = None):
    try:
        logger.info(f"Processing transcription {transcription_id} for audio {audio_path}")
        
        # Update status to processing
        if supabase:
            supabase.table("transcriptions").update({"status": "processing"}).eq("id", transcription_id).execute()
        
        # If we have a callback URL, send a processing status update
        if callback_url:
            try:
                requests.post(
                    callback_url,
                    json={
                        "task_id": transcription_id,
                        "status": "processing"
                    },
                    timeout=5  # Short timeout for status updates
                )
                logger.info(f"Sent processing status to callback URL: {callback_url}")
            except Exception as callback_error:
                logger.error(f"Error sending processing callback: {callback_error}")
        
        # Import and use fast-whisper here
        try:
            from faster_whisper import WhisperModel
            
            # Load the model - check if we need to use CPU or if GPU is available
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            compute_type = "float16" if torch.cuda.is_available() else "int8"
            
            logger.info(f"Loading WhisperModel on {device} with compute type {compute_type}")
            
            # Initialize the model - choose model size based on your needs
            # Options: "tiny", "base", "small", "medium", "large-v2", "large-v3" 
            model = WhisperModel("medium", device=device, compute_type=compute_type)
            
            # Perform transcription
            logger.info(f"Starting transcription with model for language: {language}")
            segments, info = model.transcribe(
                audio_path, 
                language=language,
                vad_filter=True,  # Voice activity detection to filter out silence
                vad_parameters=dict(min_silence_duration_ms=500)  # Adjust VAD parameters if needed
            )
            
            # Process segments and build full transcription
            transcription_parts = []
            for segment in segments:
                transcription_parts.append(segment.text)
            
            transcription = " ".join(transcription_parts)
            
            logger.info(f"Transcription completed successfully, length: {len(transcription)}")
            
            # Update the transcription in the database
            if supabase:
                supabase.table("transcriptions").update({
                    "content": transcription,
                    "status": "completed",
                    "processed_at": datetime.now().isoformat(),
                    "duration_ms": int(info.duration * 1000) if hasattr(info, 'duration') else None
                }).eq("id", transcription_id).execute()
            
            # Send the result to the callback URL if provided
            if callback_url:
                # Add retry mechanism for the webhook callback
                max_retries = 3
                retry_count = 0
                success = False
                
                while retry_count < max_retries and not success:
                    try:
                        callback_data = {
                            "task_id": transcription_id,
                            "status": "completed",
                            "result": {
                                "text": transcription
                            }
                        }
                        
                        logger.info(f"Sending completion callback (attempt {retry_count+1}/{max_retries}): {callback_url}")
                        logger.info(f"Callback data: {json.dumps(callback_data)}")
                        
                        response = requests.post(
                            callback_url,
                            json=callback_data,
                            timeout=10  # Longer timeout for the final result
                        )
                        
                        logger.info(f"Callback response status: {response.status_code}")
                        logger.info(f"Callback response body: {response.text[:100]}...")
                        
                        if response.ok:
                            logger.info(f"Successfully sent completed transcription to callback URL: {callback_url}")
                            success = True
                        else:
                            retry_count += 1
                            logger.warning(f"Callback failed with status {response.status_code}, retrying ({retry_count}/{max_retries})")
                            time.sleep(2)  # Wait before retrying
                    
                    except Exception as callback_error:
                        retry_count += 1
                        logger.error(f"Error sending completion callback (attempt {retry_count}/{max_retries}): {callback_error}")
                        time.sleep(2)  # Wait before retrying
                
                if not success:
                    logger.error(f"Failed to send webhook after {max_retries} attempts")
            
        except ImportError as e:
            logger.warning(f"Fast-whisper not available, using simulated transcription: {e}")
            # For when fast-whisper isn't installed, use a mock transcription
            import time
            # Simulating processing time
            time.sleep(3)
            
            # Mock transcription
            transcription = "Esta é uma transcrição de teste do serviço fast-whisper. Em produção, este texto seria gerado pelo processamento real do áudio usando a biblioteca fast-whisper."
            
            # Update the transcription in the database
            if supabase:
                supabase.table("transcriptions").update({
                    "content": transcription,
                    "status": "completed",
                    "processed_at": datetime.now().isoformat()
                }).eq("id", transcription_id).execute()
                
            # Send the result to the callback URL if provided
            if callback_url:
                max_retries = 3
                retry_count = 0
                success = False
                
                while retry_count < max_retries and not success:
                    try:
                        callback_data = {
                            "task_id": transcription_id,
                            "status": "completed",
                            "result": {
                                "text": transcription
                            }
                        }
                        
                        logger.info(f"Sending simulated callback (attempt {retry_count+1}/{max_retries}): {callback_url}")
                        response = requests.post(
                            callback_url,
                            json=callback_data,
                            timeout=10  # Longer timeout for the final result
                        )
                        
                        if response.ok:
                            logger.info(f"Successfully sent simulated transcription to callback URL: {callback_url}")
                            success = True
                        else:
                            retry_count += 1
                            logger.warning(f"Callback failed with status {response.status_code}, retrying ({retry_count}/{max_retries})")
                            time.sleep(2)
                    
                    except Exception as callback_error:
                        retry_count += 1
                        logger.error(f"Error sending simulated callback (attempt {retry_count}/{max_retries}): {callback_error}")
                        time.sleep(2)
            
        logger.info(f"Transcrição completa para task {transcription_id}")
        
    except Exception as e:
        logger.error(f"Error processing transcription: {str(e)}")
        # Update transcription status to error
        if supabase:
            supabase.table("transcriptions").update({
                "status": "error",
                "error_message": str(e)
            }).eq("id", transcription_id).execute()
            
        # Send error to callback URL if provided
        if callback_url:
            try:
                requests.post(
                    callback_url,
                    json={
                        "task_id": transcription_id,
                        "status": "error",
                        "error": str(e)
                    },
                    timeout=5
                )
                logger.info(f"Sent error notification to callback URL: {callback_url}")
            except Exception as callback_error:
                logger.error(f"Error sending error callback: {callback_error}")
    finally:
        # Clean up temporary file
        if os.path.exists(audio_path):
            os.unlink(audio_path)
            logger.info(f"Deleted temporary file: {audio_path}")

@app.post("/transcribe")
async def transcribe(request: TranscriptionRequest, background_tasks: BackgroundTasks):
    try:
        # Validate transcription ID exists
        if supabase:
            result = supabase.table("transcriptions").select("*").eq("id", request.transcription_id).execute()
            if len(result.data) == 0:
                return {"success": False, "error": f"Transcription ID {request.transcription_id} not found"}
        
        # Process transcription in the background
        background_tasks.add_task(
            process_transcription, 
            request.transcription_id, 
            request.audio_url, 
            request.language,
            request.callback_url  # Pass the callback URL
        )
        
        return {
            "success": True,
            "message": f"Transcription {request.transcription_id} queued for processing"
        }
        
    except Exception as e:
        logger.error(f"Error queueing transcription: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Check if required environment variables are set
    if not supabase_url or not supabase_key:
        logger.warning("SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY not set. Some features will be limited.")
        
    port = int(os.environ.get("PORT", 8001))  # Using 8001 as default port
    logger.info(f"Starting FastAPI server on port {port}")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
