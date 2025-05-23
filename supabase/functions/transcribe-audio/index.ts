
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleTranscription, TranscriptionParams } from './handlers.ts';
import { createSupabaseClient } from './utils/clientUtils.ts';
import { handleTranscriptionError } from './statusUpdater.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let noteId, recordingId, audioUrl, isChunkedTranscription, chunkIndex, totalChunks; 
  
  try {
    const requestBody = await req.json();
    const { 
      recordingId: reqRecordingId, 
      noteId: reqNoteId, 
      duration, 
      isLargeFile, 
      isRetry,
      audioUrl: reqAudioUrl,
      isChunkedTranscription: reqIsChunked,
      chunkIndex: reqChunkIndex,
      totalChunks: reqTotalChunks
    } = requestBody;
    
    recordingId = reqRecordingId;
    noteId = reqNoteId;
    audioUrl = reqAudioUrl;
    isChunkedTranscription = reqIsChunked;
    chunkIndex = reqChunkIndex;
    totalChunks = reqTotalChunks;
    
    const logParams = {
      recordingId, 
      noteId, 
      duration: duration ? `${Math.round(duration/1000)} seconds` : 'unknown',
      isLargeFile, 
      isRetry,
      isChunkedTranscription,
      chunkIndex,
      totalChunks,
      hasAudioUrl: !!audioUrl
    };
    
    console.log('[transcribe-audio] Starting transcription process with parameters:', logParams);

    const transcriptionText = await handleTranscription({
      recordingId,
      noteId,
      duration,
      isLargeFile,
      isRetry,
      audioUrl,
      isChunkedTranscription,
      chunkIndex,
      totalChunks
    });

    console.log('[transcribe-audio] Process completed successfully');

    return new Response(
      JSON.stringify({ success: true, transcription: transcriptionText }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('[transcribe-audio] Error:', error);
    
    // Determine if this is a file not found error
    const isFileNotFoundError = error.message && (
      error.message.includes('not found') || 
      error.message.includes('File not found')
    );
    
    try {
      if (noteId || recordingId) {
        const supabase = createSupabaseClient();
        let note;
        
        if (noteId) {
          // Get note directly by ID
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('id', noteId)
            .single();
            
          if (!error && data) note = data;
        } else if (recordingId) {
          // Get note via recording ID
          try {
            const { data, error } = await supabase
              .from('notes')
              .select('*')
              .eq('recording_id', recordingId)
              .single();
              
            if (!error && data) note = data;
          } catch (getNoteError) {
            console.error('[transcribe-audio] Error getting note for recording:', getNoteError);
          }
        }
        
        if (note) {
          let errorMessage = error.message;
          
          // Enhance error message for file not found errors
          if (isFileNotFoundError) {
            errorMessage = `File not found in storage: ${note.audio_url || audioUrl || 'unknown file'}`;
          }
          
          // Only update the main note status if this is not a chunk in a chunked transcription
          if (!isChunkedTranscription) {
            await handleTranscriptionError(note.id, error);
          }
        }
      }
    } catch (handlingError) {
      console.error('[transcribe-audio] Error while handling error:', handlingError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        isFileNotFoundError: isFileNotFoundError
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Always return 200 to avoid CORS issues, even on errors
      }
    );
  }
});
