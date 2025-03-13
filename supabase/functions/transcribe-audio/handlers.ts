
import { 
  createSupabaseClient, 
  getRecordingData, 
  getNoteData 
} from './supabaseClient.ts';
import { downloadAndValidateAudio, processTranscription, downloadAudioFromUrl } from './transcriptionService.ts';
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
  audioUrl?: string;
  isChunkedTranscription?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
}) {
  const { 
    recordingId, 
    noteId, 
    duration, 
    isLargeFile, 
    isRetry, 
    isExtremelyLargeFile,
    audioUrl,
    isChunkedTranscription,
    chunkIndex,
    totalChunks
  } = requestBody;
  
  console.log('[transcribe-audio] Starting transcription process with params:', { 
    recordingId, 
    noteId, 
    duration: duration ? `${Math.round(duration/1000/60)} minutes` : 'unknown',
    isLargeFile, 
    isExtremelyLargeFile,
    isRetry,
    audioUrl: audioUrl ? 'provided' : 'not provided',
    isChunkedTranscription,
    chunkIndex,
    totalChunks
  });
  
  if ((!recordingId && !noteId) && !audioUrl) {
    throw new Error('Either Recording ID, Note ID, or Audio URL is required');
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
  let audioData;
  
  try {
    if (audioUrl && noteId && isChunkedTranscription) {
      // Special handling for chunked transcription - download audio directly from URL
      console.log(`[transcribe-audio] Processing chunk ${chunkIndex} of ${totalChunks}`);
      
      note = await getNoteData(supabase, noteId, true);
      
      // For chunked transcriptions, don't update the main note progress to avoid conflicts
      progressTracker = new ProgressTracker(
        supabase, 
        noteId, 
        isChunkedTranscription, 
        chunkIndex, 
        totalChunks
      );
      
      // Download audio directly from the URL
      console.log('[transcribe-audio] Downloading audio chunk from URL');
      audioData = await downloadAudioFromUrl(audioUrl);
      
      console.log('[transcribe-audio] Audio chunk downloaded successfully:', 
        `Size: ${Math.round(audioData.size/1024/1024*100)/100}MB`);
    } else if (noteId && isRetry) {
      // For retry operations, get the note first, then the recording
      note = await getNoteData(supabase, noteId, true);
      recording = await getRecordingData(supabase, note.recording_id);
      
      // Initialize progress tracker
      progressTracker = new ProgressTracker(supabase, note.id);
      
      // Initial progress update - started
      await progressTracker.markStarted();
      
      // Download and validate the audio file
      audioData = await downloadAndValidateAudio(
        supabase, 
        recording.file_path, 
        progressTracker
      );
    } else if (recordingId) {
      // Normal flow - get recording first
      recording = await getRecordingData(supabase, recordingId);
      note = noteId ? 
        await getNoteData(supabase, noteId, true) : 
        await getNoteData(supabase, recordingId);
      
      // Initialize progress tracker
      progressTracker = new ProgressTracker(supabase, note.id);
      
      // Initial progress update - started
      await progressTracker.markStarted();
      
      // Download and validate the audio file
      audioData = await downloadAndValidateAudio(
        supabase, 
        recording.file_path, 
        progressTracker
      );
    } else if (audioUrl && noteId) {
      // Direct URL transcription (not chunked)
      note = await getNoteData(supabase, noteId, true);
      
      // Initialize progress tracker
      progressTracker = new ProgressTracker(supabase, note.id);
      
      // Initial progress update - started
      await progressTracker.markStarted();
      
      // Download audio directly from the URL
      console.log('[transcribe-audio] Downloading audio from URL');
      audioData = await downloadAudioFromUrl(audioUrl);
      progressTracker.markDownloaded();
    } else {
      throw new Error('Invalid parameters for transcription');
    }
    
    console.log('[transcribe-audio] Retrieved data and audio:', {
      noteId: note.id,
      audioSize: audioData ? `${Math.round(audioData.size/1024/1024*100)/100}MB` : 'null'
    });
  } catch (error) {
    console.error('[transcribe-audio] Error retrieving data or audio:', error);
    throw error;
  }

  // Process the transcription
  return await processTranscription(
    supabase, 
    note, 
    recording, // May be undefined for direct URL transcription
    audioData, 
    progressTracker,
    isExtremelyLargeFile,
    isChunkedTranscription,
    chunkIndex,
    totalChunks
  );
}
