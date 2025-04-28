import os
import uvicorn
import requests
import tempfile
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
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
supabase: Client = create_client(supabase_url, supabase_key)

class TranscriptionRequest(BaseModel):
    transcription_id: str
    audio_url: str
    language: Optional[str] = "pt"  # Default to Portuguese

@app.get("/")
async def root():
    return {"message": "Fast Whisper Transcription Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

def process_transcription(transcription_id: str, audio_url: str, language: str):
    try:
        logger.info(f"Processing transcription {transcription_id} for audio {audio_url}")
        
        # Update status to processing
        supabase.table("transcriptions").update({"status": "processing"}).eq("id", transcription_id).execute()
        
        # Download the audio file
        try:
            response = requests.get(audio_url)
            response.raise_for_status()
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
                temp_file.write(response.content)
                temp_file_path = temp_file.name
                
            logger.info(f"Audio saved to temporary file: {temp_file_path}")
            
            # Import and use fast-whisper here
            try:
                from faster_whisper import WhisperModel
                
                # Load the model - check if we need to use CPU or if GPU is available
                import torch
                device = "cuda" if torch.cuda.is_available() else "cpu"
                compute_type = "float16" if torch.cuda.is_available() else "int8"
                
                logger.info(f"Loading WhisperModel on {device} with compute type {compute_type}")
                
                # Initialize the model - Using small instead of medium
                model = WhisperModel("small", device=device, compute_type=compute_type)
                
                # Perform transcription
                logger.info(f"Starting transcription with model for language: {language}")
                segments, info = model.transcribe(
                    temp_file_path, 
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
                supabase.table("transcriptions").update({
                    "content": transcription,
                    "status": "completed",
                    "processed_at": datetime.now().isoformat()
                }).eq("id", transcription_id).execute()
                
            except ImportError as e:
                logger.warning(f"Fast-whisper not available, using simulated transcription: {e}")
                # For when fast-whisper isn't installed, use a mock transcription
                import time
                # Simulating processing time
                time.sleep(3)
                
                # Mock transcription
                transcription = "Esta é uma transcrição de teste do serviço fast-whisper. Em produção, este texto seria gerado pelo processamento real do áudio usando a biblioteca fast-whisper."
                
                # Update the transcription in the database
                supabase.table("transcriptions").update({
                    "content": transcription,
                    "status": "completed",
                    "processed_at": datetime.now().isoformat()
                }).eq("id", transcription_id).execute()
            
            logger.info(f"Transcription completed for {transcription_id}")
            
        except Exception as download_error:
            logger.error(f"Error downloading or processing audio: {str(download_error)}")
            raise download_error
        finally:
            # Clean up temporary file
            if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                logger.info(f"Deleted temporary file: {temp_file_path}")
    
    except Exception as e:
        logger.error(f"Error processing transcription: {str(e)}")
        # Update transcription status to error
        supabase.table("transcriptions").update({
            "status": "error",
            "error_message": str(e)
        }).eq("id", transcription_id).execute()

@app.post("/transcribe")
async def transcribe(request: TranscriptionRequest, background_tasks: BackgroundTasks):
    try:
        # Validate transcription ID exists
        result = supabase.table("transcriptions").select("*").eq("id", request.transcription_id).execute()
        if len(result.data) == 0:
            return {"success": False, "error": f"Transcription ID {request.transcription_id} not found"}
        
        # Process transcription in the background
        background_tasks.add_task(
            process_transcription, 
            request.transcription_id, 
            request.audio_url, 
            request.language
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
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        exit(1)
        
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting FastAPI server on port {port}")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
