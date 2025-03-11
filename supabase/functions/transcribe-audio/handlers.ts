
import { createSupabaseClient, getRecordingData, getNoteData, updateNoteStatus, updateRecordingAndNote } from './supabaseClient.ts';
import { downloadAudioFile } from './storageClient.ts';
import { transcribeAudio } from './openaiClient.ts';

// Constants for file size and duration limits
export const MAX_AUDIO_DURATION_MS = 60 * 60 * 1000; // 60 minutes in milliseconds
export const MAX_FILE_SIZE_MB = 24; // 24 MB (OpenAI limit is 25MB)

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleTranscription(requestBody: {
  recordingId?: string;
  noteId?: string;
  duration?: number;
  isLargeFile?: boolean;
  isRetry?: boolean;
}) {
  const { recordingId, noteId, duration, isLargeFile, isRetry } = requestBody;
  
  console.log('[transcribe-audio] Starting transcription process with params:', { 
    recordingId, 
    noteId, 
    duration: duration ? `${Math.round(duration/1000/60)} minutes` : 'unknown',
    isLargeFile, 
    isRetry 
  });
  
  if (!recordingId && !noteId) {
    throw new Error('Either Recording ID or Note ID is required');
  }

  // Check for file size constraints
  if (duration && duration > MAX_AUDIO_DURATION_MS) {
    console.warn('[transcribe-audio] Audio file exceeds maximum recommended duration:', 
      `${Math.round(duration/1000/60)} minutes. Max: ${MAX_AUDIO_DURATION_MS/1000/60} minutes`);
  }

  const supabase = createSupabaseClient();

  // Get recording and note data
  let recording;
  let note;
  
  try {
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
    
    console.log('[transcribe-audio] Retrieved recording and note data:', {
      recordingId: recording.id,
      noteId: note.id,
      filePath: recording.file_path,
      status: recording.status
    });
  } catch (error) {
    console.error('[transcribe-audio] Error retrieving recording or note data:', error);
    throw error;
  }

  // Update note status to processing with 10% for better feedback
  await updateNoteStatus(supabase, note.id, 'processing', 10);

  // Download audio file
  console.log('[transcribe-audio] Starting download of audio file:', recording.file_path);
  let audioData;
  try {
    audioData = await downloadAudioFile(supabase, recording.file_path);
    
    // Additional check for file validity
    if (!audioData || audioData.size === 0) {
      throw new Error('Downloaded audio file is empty or invalid');
    }
    
    console.log('[transcribe-audio] File downloaded successfully:', 
      `Size: ${Math.round(audioData.size/1024/1024*100)/100}MB`);
      
    // Update progress after download
    await updateNoteStatus(supabase, note.id, 'processing', 25);
  } catch (error) {
    console.error('[transcribe-audio] Error downloading audio file:', error);
    await updateNoteStatus(supabase, note.id, 'error', 0);
    await supabase
      .from('notes')
      .update({ 
        error_message: `Error downloading audio file: ${error.message}`
      })
      .eq('id', note.id);
    throw error;
  }

  // Check if file is too large for direct transcription
  if (audioData.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    console.warn('[transcribe-audio] Audio file is too large:', 
      `${Math.round(audioData.size/1024/1024*100)/100}MB`);
    
    await updateNoteStatus(supabase, note.id, 'error', 0);
    await supabase
      .from('notes')
      .update({ 
        error_message: `Audio file too large for processing. Maximum size is ${MAX_FILE_SIZE_MB}MB. Please use a shorter recording.`
      })
      .eq('id', note.id);
      
    throw new Error('Audio file exceeds size limit for transcription');
  }

  return await processTranscription(supabase, note, recording, audioData);
}

async function processTranscription(supabase: any, note: any, recording: any, audioData: Blob) {
  // Update status to transcribing with 40% progress
  await updateNoteStatus(supabase, note.id, 'transcribing', 40);
  
  // Set a timeout for transcription
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Transcription timed out after 60 minutes')), 60 * 60 * 1000);
  });
  
  let transcription;
  try {
    console.log('[transcribe-audio] Starting transcription...');
    const transcriptionPromise = transcribeAudio(audioData);
    
    // Update progress during transcription
    await updateNoteStatus(supabase, note.id, 'transcribing', 50);
    
    transcription = await Promise.race([transcriptionPromise, timeoutPromise]);
    
    // Update progress after successful transcription
    await updateNoteStatus(supabase, note.id, 'transcribing', 75);
    
    console.log('[transcribe-audio] Transcription completed successfully, text length:', 
      transcription.text ? transcription.text.length : 0);
  } catch (error) {
    console.error('[transcribe-audio] Transcription error or timeout:', error);
    await updateNoteStatus(supabase, note.id, 'error', 0);
    await supabase
      .from('notes')
      .update({ 
        error_message: error instanceof Error ? 
          `Transcription error: ${error.message}` : 
          'Transcription failed'
      })
      .eq('id', note.id);
    throw error;
  }
  
  // Update recording and note with transcription
  try {
    await updateRecordingAndNote(supabase, recording.id, note.id, transcription.text);
    console.log('[transcribe-audio] Updated database with transcription');
    
    // Update progress to 90% before starting minutes generation
    await updateNoteStatus(supabase, note.id, 'generating_minutes', 90);
  } catch (error) {
    console.error('[transcribe-audio] Error updating database with transcription:', error);
    throw error;
  }

  // Start meeting minutes generation
  await startMeetingMinutesGeneration(supabase, note.id, transcription.text);
  
  return transcription.text;
}

async function startMeetingMinutesGeneration(supabase: any, noteId: string, transcriptionText: string) {
  console.log('[transcribe-audio] Starting meeting minutes generation...');
  try {
    const { error: minutesError } = await supabase.functions
      .invoke('generate-meeting-minutes', {
        body: { 
          noteId: noteId,
          transcription: transcriptionText
        }
      });

    if (minutesError) {
      console.error('[transcribe-audio] Error starting meeting minutes generation:', minutesError);
      // Don't throw here, we already have the transcription
    }
  } catch (error) {
    console.error('[transcribe-audio] Error invoking meeting minutes function:', error);
    // Continue anyway, the transcription part is complete
  }
}
