
import { 
  createSupabaseClient, 
  getRecordingData, 
  getNoteData, 
  updateNoteStatus, 
  updateRecordingAndNote 
} from './supabaseClient.ts';
import { downloadAudioFile } from './storageClient.ts';
import { transcribeAudio } from './openaiClient.ts';
import { startMeetingMinutesGeneration, updateNoteProgress } from './utils/dataOperations.ts';

// Constants for file size and duration limits
export const MAX_AUDIO_DURATION_MS = 120 * 60 * 1000; // 120 minutes in milliseconds (extended from 60)
export const MAX_FILE_SIZE_MB = 100; // 100 MB (increased from 24MB)

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Progress percentage stages for consistent progress reporting
const PROGRESS_STAGES = {
  STARTED: 5,
  DOWNLOADING: 15,
  DOWNLOADED: 25,
  PROCESSING: 40,
  TRANSCRIBING: 60,
  TRANSCRIBED: 80,
  GENERATING_MINUTES: 90,
  COMPLETED: 100
};

export async function handleTranscription(requestBody: {
  recordingId?: string;
  noteId?: string;
  duration?: number;
  isLargeFile?: boolean;
  isRetry?: boolean;
  isExtremelyLargeFile?: boolean;
}) {
  const { recordingId, noteId, duration, isLargeFile, isRetry, isExtremelyLargeFile } = requestBody;
  
  console.log('[transcribe-audio] Starting transcription process with params:', { 
    recordingId, 
    noteId, 
    duration: duration ? `${Math.round(duration/1000/60)} minutes` : 'unknown',
    isLargeFile, 
    isExtremelyLargeFile,
    isRetry 
  });
  
  if (!recordingId && !noteId) {
    throw new Error('Either Recording ID or Note ID is required');
  }

  // Check for file size constraints - now only logging a warning since we support up to 120 minutes
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
      note = await getNoteData(supabase, noteId, true);
      recording = await getRecordingData(supabase, note.recording_id);
    } else if (recordingId) {
      // Normal flow - get recording first
      recording = await getRecordingData(supabase, recordingId);
      note = noteId ? 
        await getNoteData(supabase, noteId, true) : 
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
    
    // Initial progress update - started
    await updateNoteProgress(supabase, note.id, 'transcribing', PROGRESS_STAGES.STARTED);
  } catch (error) {
    console.error('[transcribe-audio] Error retrieving recording or note data:', error);
    throw error;
  }

  // Download audio file
  console.log('[transcribe-audio] Starting download of audio file:', recording.file_path);
  let audioData;
  try {
    // Update progress to downloading
    await updateNoteProgress(supabase, note.id, 'transcribing', PROGRESS_STAGES.DOWNLOADING);
    
    audioData = await downloadAudioFile(supabase, recording.file_path);
    
    // Additional check for file validity
    if (!audioData || audioData.size === 0) {
      throw new Error('Downloaded audio file is empty or invalid');
    }
    
    console.log('[transcribe-audio] File downloaded successfully:', 
      `Size: ${Math.round(audioData.size/1024/1024*100)/100}MB`);
      
    // Update progress after download
    await updateNoteProgress(supabase, note.id, 'transcribing', PROGRESS_STAGES.DOWNLOADED);
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
      `${Math.round(audioData.size/1024/1024*100)/100}MB. Maximum is ${MAX_FILE_SIZE_MB}MB`);
    
    await updateNoteStatus(supabase, note.id, 'error', 0);
    await supabase
      .from('notes')
      .update({ 
        error_message: `Audio file too large for processing. Maximum size is ${MAX_FILE_SIZE_MB}MB. Please use a shorter recording or compress your audio.`
      })
      .eq('id', note.id);
      
    throw new Error(`Audio file exceeds size limit for transcription (max: ${MAX_FILE_SIZE_MB}MB)`);
  }

  return await processTranscription(supabase, note, recording, audioData, isExtremelyLargeFile);
}

async function processTranscription(supabase: any, note: any, recording: any, audioData: Blob, isExtremelyLargeFile?: boolean) {
  // Update status to processing with consistent progress
  await updateNoteProgress(supabase, note.id, 'transcribing', PROGRESS_STAGES.PROCESSING);
  
  // Set a timeout for transcription - extended for longer recordings
  const timeoutDuration = isExtremelyLargeFile ? 240 * 60 * 1000 : 120 * 60 * 1000; // 4 hours for very large files, 2 hours otherwise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Transcription timed out after ${timeoutDuration / 60 / 1000} minutes`)), timeoutDuration);
  });
  
  let transcription;
  try {
    console.log('[transcribe-audio] Starting transcription...');
    const transcriptionPromise = transcribeAudio(audioData);
    
    // Update progress during transcription
    await updateNoteProgress(supabase, note.id, 'transcribing', PROGRESS_STAGES.TRANSCRIBING);
    
    transcription = await Promise.race([transcriptionPromise, timeoutPromise]);
    
    // Update progress after successful transcription
    await updateNoteProgress(supabase, note.id, 'transcribing', PROGRESS_STAGES.TRANSCRIBED);
    
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
    
    // Update progress to generating minutes stage
    await updateNoteProgress(supabase, note.id, 'generating_minutes', PROGRESS_STAGES.GENERATING_MINUTES);
  } catch (error) {
    console.error('[transcribe-audio] Error updating database with transcription:', error);
    throw error;
  }

  // Start meeting minutes generation
  try {
    await startMeetingMinutesGeneration(supabase, note.id, transcription.text);
    
    // Ensure status is updated to completed with 100% progress
    await updateNoteProgress(supabase, note.id, 'completed', PROGRESS_STAGES.COMPLETED);
    console.log('[transcribe-audio] Updated note status to completed after minutes generation');
  } catch (error) {
    console.error('[transcribe-audio] Error in meeting minutes generation:', error);
    // Even if minutes generation fails, mark the transcription as completed since we have the transcript
    await updateNoteProgress(supabase, note.id, 'completed', PROGRESS_STAGES.COMPLETED);
    console.log('[transcribe-audio] Updated note status to completed despite minutes generation error');
  }
  
  return transcription.text;
}
