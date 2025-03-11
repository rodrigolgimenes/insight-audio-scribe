
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getRecordingData, getNoteData, updateNoteStatus, updateRecordingAndNote, handleTranscriptionError } from './supabaseClient.ts';
import { downloadAudioFile } from './storageClient.ts';
import { transcribeAudio } from './openaiClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_AUDIO_DURATION_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordingId, noteId, duration, isLargeFile, isRetry } = await req.json();
    console.log('[transcribe-audio] Starting transcription process for recording:', recordingId);
    console.log('[transcribe-audio] Parameters:', { noteId, duration, isLargeFile, isRetry });
    
    if (!recordingId && !noteId) {
      throw new Error('Either Recording ID or Note ID is required');
    }

    // Check for file size constraints
    if (duration && duration > MAX_AUDIO_DURATION_MS && !isLargeFile) {
      console.warn('[transcribe-audio] Audio file exceeds maximum recommended duration:', 
        `${Math.round(duration/1000/60)} minutes. Max: ${MAX_AUDIO_DURATION_MS/1000/60} minutes`);
    }

    const supabase = createSupabaseClient();

    // Get recording and note data
    let recording;
    let note;
    
    if (noteId && isRetry) {
      // For retry operations, get the note first, then the recording
      note = await getNoteData(supabase, noteId);
      recording = await getRecordingData(supabase, note.recording_id);
    } else if (recordingId) {
      // Normal flow - get recording first
      recording = await getRecordingData(supabase, recordingId);
      note = noteId ? 
        await getNoteData(supabase, noteId) : 
        await getNoteData(supabase, recordingId);
    } else {
      throw new Error('Invalid parameters for transcription');
    }

    // Update note status to downloading
    await updateNoteStatus(supabase, note.id, 'processing', 25);

    // Download audio file
    console.log('[transcribe-audio] Starting download with retry...');
    const audioData = await downloadAudioFile(supabase, recording.file_path);
    console.log('[transcribe-audio] File downloaded successfully:', 
      `Size: ${Math.round(audioData.size/1024/1024*100)/100}MB`);

    // Update progress after successful download
    await updateNoteStatus(supabase, note.id, 'transcribing', 50);

    // Check if file is too large for direct transcription
    if (audioData.size > 24 * 1024 * 1024) { // Close to 25MB limit
      console.warn('[transcribe-audio] Audio file is large:', 
        `${Math.round(audioData.size/1024/1024*100)/100}MB`);
      
      await updateNoteStatus(supabase, note.id, 'error', 0);
      await supabase
        .from('notes')
        .update({ 
          error_message: 'Audio file too large for processing. Please use a shorter recording.'
        })
        .eq('id', note.id);
        
      throw new Error('Audio file exceeds size limit for transcription');
    }

    // Transcribe audio with timeout handling
    console.log('[transcribe-audio] Starting transcription...');
    const transcriptionPromise = transcribeAudio(audioData);
    
    // Set a timeout for transcription (60 minutes instead of 15 minutes)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Transcription timed out')), 60 * 60 * 1000);
    });
    
    const transcription = await Promise.race([transcriptionPromise, timeoutPromise])
      .catch(error => {
        console.error('[transcribe-audio] Transcription error or timeout:', error);
        updateNoteStatus(supabase, note.id, 'error', 0);
        supabase
          .from('notes')
          .update({ 
            error_message: error instanceof Error ? error.message : 'Transcription failed'
          })
          .eq('id', note.id);
        throw error;
      });
    
    console.log('[transcribe-audio] Transcription completed successfully');
    
    // Update recording and note with transcription
    await updateRecordingAndNote(supabase, recording.id, note.id, transcription.text);

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
      // Don't throw here, we already have the transcription
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
      const { recordingId, noteId } = await req.json();
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
          note = await getNoteData(supabase, recordingId);
        }
        
        if (note) {
          await handleTranscriptionError(supabase, note.id);
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
