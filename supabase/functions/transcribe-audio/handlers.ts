
import { 
  createSupabaseClient, 
  getRecordingData, 
  getNoteData 
} from './supabaseClient.ts';
import { downloadAndValidateAudio, processTranscription } from './transcriptionService.ts';
import { ProgressTracker } from './progressTracker.ts';
import { MAX_AUDIO_DURATION_MS, corsHeaders } from './constants.ts';

export { corsHeaders } from './constants.ts';

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
  let progressTracker;
  
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
    
    // Initialize progress tracker
    progressTracker = new ProgressTracker(supabase, note.id);
    
    // Initial progress update - started
    await progressTracker.markStarted();
  } catch (error) {
    console.error('[transcribe-audio] Error retrieving recording or note data:', error);
    throw error;
  }

  // Download and validate the audio file
  const audioData = await downloadAndValidateAudio(
    supabase, 
    recording.file_path, 
    progressTracker
  );

  // Process the transcription
  return await processTranscription(
    supabase, 
    note, 
    recording, 
    audioData, 
    progressTracker,
    isExtremelyLargeFile
  );
}
