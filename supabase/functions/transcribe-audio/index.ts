
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
    const note = await getNoteData(supabase, recordingId);

    // Update note status to downloading
    await updateNoteStatus(supabase, note.id, 'processing', 25);

    // Download audio file
    console.log('[transcribe-audio] Starting download with retry...');
    const audioData = await downloadAudioFile(supabase, recording.file_path);
    console.log('[transcribe-audio] File downloaded successfully');

    // Update progress after successful download
    await updateNoteStatus(supabase, note.id, 'transcribing', 50);

    // Transcribe audio
    const transcription = await transcribeAudio(audioData);
    
    // Update recording and note with transcription
    await updateRecordingAndNote(supabase, recordingId, note.id, transcription.text);

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
        await handleTranscriptionError(supabase, note.id);
      }
    } catch {
      // Ignore errors in error handling
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
