
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getRecordingData, getNoteData, updateNoteStatus, updateRecordingAndNote, handleTranscriptionError } from './supabaseClient.ts';
import { downloadAudioFile } from './storageClient.ts';
import { transcribeAudio } from './openaiClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId } = await req.json();
    console.log('[transcribe-audio] Starting transcription process for recording:', recordingId);
    
    if (!recordingId) {
      throw new Error('Recording ID is required');
    }

    const supabase = createSupabaseClient();

    // Get recording and note data
    const recording = await getRecordingData(supabase, recordingId);
    console.log('[transcribe-audio] Got recording data:', recording);

    const note = await getNoteData(supabase, recordingId);
    console.log('[transcribe-audio] Got note data:', note);

    // Update note status to downloading
    await updateNoteStatus(supabase, note.id, 'processing', 25);
    console.log('[transcribe-audio] Updated note status to processing');

    // Download audio file
    console.log('[transcribe-audio] Starting audio download...');
    const audioData = await downloadAudioFile(supabase, recording.file_path);
    console.log('[transcribe-audio] Audio file downloaded successfully');

    // Update progress after successful download
    await updateNoteStatus(supabase, note.id, 'transcribing', 50);
    console.log('[transcribe-audio] Updated note status to transcribing');

    // Transcribe audio
    console.log('[transcribe-audio] Starting transcription...');
    const transcription = await transcribeAudio(audioData);
    console.log('[transcribe-audio] Transcription completed');
    
    // Update recording and note with transcription
    await updateRecordingAndNote(supabase, recordingId, note.id, transcription.text);
    console.log('[transcribe-audio] Updated recording and note with transcription');

    // Start meeting minutes generation
    console.log('[transcribe-audio] Starting meeting minutes generation...');
    const { error: minutesError } = await supabase.functions
      .invoke('generate-meeting-minutes', {
        body: { 
          noteId: note.id,
          transcription: transcription.text
        }
      });

    if (minutesError) {
      console.error('[transcribe-audio] Error starting meeting minutes generation:', minutesError);
      throw minutesError;
    }

    console.log('[transcribe-audio] Process completed successfully');

    return new Response(
      JSON.stringify({ success: true, transcription: transcription.text }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('[transcribe-audio] Error:', error);
    
    try {
      const { recordingId } = await req.json();
      if (recordingId) {
        const supabase = createSupabaseClient();
        const note = await getNoteData(supabase, recordingId);
        if (note) {
          await handleTranscriptionError(supabase, note.id);
          console.log('[transcribe-audio] Updated note status to error');
        }
      }
    } catch (err) {
      console.error('[transcribe-audio] Error handling failure:', err);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 // Mudado para 500 para indicar erro do servidor
      }
    );
  }
});
