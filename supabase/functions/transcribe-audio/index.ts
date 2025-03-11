
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleTranscription, corsHeaders } from './handlers.ts';
import { createSupabaseClient } from './supabaseClient.ts';
import { handleTranscriptionError } from './supabaseClient.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let noteId, recordingId; 
  
  try {
    const requestBody = await req.json();
    const { recordingId: reqRecordingId, noteId: reqNoteId, duration, isLargeFile, isRetry } = requestBody;
    
    recordingId = reqRecordingId;
    noteId = reqNoteId;
    
    const transcriptionText = await handleTranscription({
      recordingId,
      noteId,
      duration,
      isLargeFile,
      isRetry
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
          await handleTranscriptionError(supabase, note.id, error.message);
        }
      }
    } catch (handlingError) {
      console.error('[transcribe-audio] Error while handling error:', handlingError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Keep 200 to avoid CORS issues
      }
    );
  }
});
