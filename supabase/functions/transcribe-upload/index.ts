
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { transcribeAudio, processWithGPT } from './openAI.ts';
import { 
  uploadToStorage, 
  updateRecordingWithTranscription
} from './supabaseOperations.ts';
import { processAudioExtraction } from './audioProcessing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to add processing logs
async function addProcessingLog(
  supabase: any,
  recordingId: string,
  noteId: string,
  stage: string,
  message: string,
  details: any = null,
  status: 'info' | 'warning' | 'error' | 'success' = 'info'
): Promise<void> {
  try {
    await supabase
      .from('processing_logs')
      .insert({
        recording_id: recordingId,
        note_id: noteId,
        stage: stage,
        message: message,
        details: details,
        status: status,
        timestamp: new Date().toISOString()
      });
    
    console.log(`[${stage}] ${message}`);
  } catch (error) {
    console.error('Error adding processing log:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let formData;
  let recordingId;
  
  try {
    console.log('Starting file processing...');
    formData = await req.formData();
    const file = formData.get('file');
    recordingId = formData.get('recordingId');
    const duration = formData.get('duration');

    if (!file || !recordingId) {
      console.error('Missing required parameters:', { file: !!file, recordingId: !!recordingId });
      throw new Error('No file uploaded or missing recordingId');
    }

    console.log('Request parameters:', {
      fileType: file instanceof File ? file.type : 'unknown',
      fileSize: file instanceof File ? file.size : 'unknown',
      recordingId,
      duration
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      console.error('Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update recording status to processing
    await addProcessingLog(
      supabase,
      recordingId,
      "", // Note ID is not available yet
      "processing_started",
      "Starting file processing",
      { 
        fileType: file instanceof File ? file.type : 'unknown',
        fileSize: file instanceof File ? file.size : 'unknown'
      },
      "info"
    );
    
    const { error: statusError } = await supabase
      .from('recordings')
      .update({ 
        status: 'processing',
        duration: duration ? parseInt(duration.toString()) : null 
      })
      .eq('id', recordingId);

    if (statusError) {
      console.error('Error updating recording status:', statusError);
      throw new Error(`Failed to update recording status: ${statusError.message}`);
    }
    
    // Check if we need to process video to extract audio
    let fileToUpload = file as File;
    let isVideoFile = fileToUpload.type.startsWith('video/');
    
    if (isVideoFile) {
      await addProcessingLog(
        supabase,
        recordingId,
        "", // Note ID is not available yet
        "file_type_detected",
        "Video file detected",
        { fileType: fileToUpload.type },
        "info"
      );
      
      console.log('Video file detected. Server-side extraction will be performed later.');
      
      // For video files, we'll upload as is and then process on the server
      // We'll mark it as requiring audio extraction for later processing
      await supabase
        .from('recordings')
        .update({
          needs_audio_extraction: true,
          original_file_type: fileToUpload.type
        })
        .eq('id', recordingId);
    } else {
      await addProcessingLog(
        supabase,
        recordingId,
        "", // Note ID is not available yet
        "file_type_detected",
        "Audio file detected",
        { fileType: fileToUpload.type },
        "info"
      );
    }
    
    // Upload the original file for now
    const baseFilePath = `${recordingId}/${crypto.randomUUID()}`;
    const originalFilePath = `${baseFilePath}_original${getExtensionFromMimeType(fileToUpload.type)}`;
    
    await addProcessingLog(
      supabase,
      recordingId,
      "", // Note ID is not available yet
      "upload_started",
      "Uploading original file",
      { 
        filePath: originalFilePath,
        size: fileToUpload.size,
        type: fileToUpload.type 
      },
      "info"
    );
    
    console.log('Uploading original file...', {
      filePath: originalFilePath,
      size: fileToUpload.size,
      type: fileToUpload.type
    });

    const { data: { publicUrl: originalUrl }, error: uploadError } = await uploadToStorage(
      supabase, 
      originalFilePath, 
      new Blob([await fileToUpload.arrayBuffer()], { type: fileToUpload.type })
    );

    if (uploadError) {
      await addProcessingLog(
        supabase,
        recordingId,
        "", // Note ID is not available yet
        "upload_error",
        "Error uploading file",
        { error: uploadError.message },
        "error"
      );
      
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    await addProcessingLog(
      supabase,
      recordingId,
      "", // Note ID is not available yet
      "upload_completed",
      "Original file uploaded successfully",
      { url: originalUrl },
      "success"
    );
    
    console.log('Original file uploaded successfully:', { originalUrl });
    
    // Create audio path that will be used after processing
    const audioFilePath = `${baseFilePath}.mp3`;

    // Update recording with file paths
    const { error: updateError } = await supabase
      .from('recordings')
      .update({
        file_path: audioFilePath, // This will be the processed audio file
        original_file_path: originalFilePath,
        audio_url: originalUrl, // Temporarily use original URL, will be updated after processing
        status: 'transcribing'
      })
      .eq('id', recordingId);

    if (updateError) {
      await addProcessingLog(
        supabase,
        recordingId,
        "", // Note ID is not available yet
        "update_error",
        "Error updating recording",
        { error: updateError.message },
        "error"
      );
      
      console.error('Error updating recording:', updateError);
      throw new Error(`Failed to update recording: ${updateError.message}`);
    }

    // Create note
    await addProcessingLog(
      supabase,
      recordingId,
      "", // Note ID is not available yet
      "note_creation",
      "Creating new note",
      null,
      "info"
    );
    
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        recording_id: recordingId,
        title: 'New Recording',
        status: 'processing',
        processing_progress: 0
      })
      .select()
      .single();

    if (noteError) {
      await addProcessingLog(
        supabase,
        recordingId,
        "", // Note ID is not available yet
        "note_creation_error",
        "Error creating note",
        { error: noteError.message },
        "error"
      );
      
      console.error('Error creating note:', noteError);
      throw new Error(`Failed to create note: ${noteError.message}`);
    }

    await addProcessingLog(
      supabase,
      recordingId,
      note.id,
      "note_created",
      "Note created successfully",
      { noteId: note.id },
      "success"
    );

    // If this is a video file, queue it for audio extraction
    if (isVideoFile) {
      await addProcessingLog(
        supabase,
        recordingId,
        note.id,
        "extraction_queued",
        "Queueing video file for audio extraction",
        { originalFilePath, audioFilePath },
        "info"
      );
      
      console.log('Queueing video file for audio extraction before transcription');
      // We'll process it in the background
      EdgeRuntime.waitUntil(processAudioExtraction(supabase, recordingId, originalFilePath, audioFilePath, note.id));
    } else {
      // For audio files, we can start transcription immediately
      await addProcessingLog(
        supabase,
        recordingId,
        note.id,
        "transcription_queued",
        "Starting transcription process",
        null,
        "info"
      );
      
      // Start transcription process
      const { error: transcribeError } = await supabase.functions
        .invoke('transcribe-audio', {
          body: { 
            noteId: note.id,
            recordingId 
          }
        });

      if (transcribeError) {
        await addProcessingLog(
          supabase,
          recordingId,
          note.id,
          "transcription_error",
          "Error starting transcription",
          { error: transcribeError.message },
          "error"
        );
        
        throw new Error(`Failed to start transcription: ${transcribeError.message}`);
      }
      
      await addProcessingLog(
        supabase,
        recordingId,
        note.id,
        "transcription_started",
        "Transcription process started successfully",
        null,
        "success"
      );
    }

    console.log('Process started successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Recording uploaded and processing started',
        noteId: note.id,
        recordingId: recordingId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-upload function:', error);
    
    try {
      if (recordingId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          await addProcessingLog(
            supabase,
            recordingId,
            "",
            "processing_error",
            "Fatal error during processing",
            { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
            "error"
          );
          
          await supabase
            .from('recordings')
            .update({ 
              status: 'error',
              error_message: error instanceof Error ? error.message : 'An unexpected error occurred'
            })
            .eq('id', recordingId);
        }
      }
    } catch (updateError) {
      console.error('Failed to update recording status to error:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        status: 200, // Changed from 500 to 200 to avoid CORS issues
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/mpeg': '.mpeg',
    'video/x-matroska': '.mkv',
    'video/3gpp': '.3gp',
    'video/x-flv': '.flv',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/wave': '.wav',
    'audio/x-wav': '.wav',
    'audio/webm': '.webm',
    'audio/ogg': '.ogg',
    'audio/aac': '.aac',
    'audio/flac': '.flac',
    'audio/x-m4a': '.m4a',
    'audio/mp4': '.m4a'
  };
  
  return mimeToExt[mimeType] || '.bin';
}
