
import { transcribeAudio } from './openaiClient.ts';
import { downloadAudioFile } from './storageClient.ts';
import { updateRecordingAndNote } from './utils/dataOperations.ts';
import { startMeetingMinutesGeneration } from './utils/dataOperations.ts';
import { ProgressTracker } from './progressTracker.ts';
import { MAX_FILE_SIZE_MB, VALID_NOTE_STATUSES } from './constants.ts';

/**
 * Download and validate the audio file
 */
export async function downloadAndValidateAudio(
  supabase: any, 
  filePath: string, 
  progressTracker: ProgressTracker
): Promise<Blob> {
  console.log('[transcribe-audio] Starting download of audio file:', filePath);
  let audioData;
  
  try {
    await progressTracker.markDownloading();
    
    audioData = await downloadAudioFile(supabase, filePath);
    
    // Additional check for file validity
    if (!audioData || audioData.size === 0) {
      throw new Error('Downloaded audio file is empty or invalid');
    }
    
    console.log('[transcribe-audio] File downloaded successfully:', 
      `Size: ${Math.round(audioData.size/1024/1024*100)/100}MB`);
      
    await progressTracker.markDownloaded();
  } catch (error) {
    console.error('[transcribe-audio] Error downloading audio file:', error);
    await progressTracker.markError(`Error downloading audio file: ${error.message}`);
    throw error;
  }

  // Check if file is too large for direct transcription
  if (audioData.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    console.warn('[transcribe-audio] Audio file is too large:', 
      `${Math.round(audioData.size/1024/1024*100)/100}MB. Maximum is ${MAX_FILE_SIZE_MB}MB`);
    
    await progressTracker.markError(
      `Audio file too large for processing. Maximum size is ${MAX_FILE_SIZE_MB}MB. Please use a shorter recording or compress your audio.`
    );
      
    throw new Error(`Audio file exceeds size limit for transcription (max: ${MAX_FILE_SIZE_MB}MB)`);
  }

  return audioData;
}

/**
 * Process transcription with error handling and progress tracking
 */
export async function processTranscription(
  supabase: any, 
  note: any, 
  recording: any, 
  audioData: Blob, 
  progressTracker: ProgressTracker,
  isExtremelyLargeFile?: boolean
): Promise<string> {
  // Update status to processing with consistent progress
  await progressTracker.markProcessing();
  
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
    await progressTracker.markTranscribing();
    
    transcription = await Promise.race([transcriptionPromise, timeoutPromise]);
    
    // Update progress after successful transcription - using a definitely valid status
    await progressTracker.markTranscribed();
    
    console.log('[transcribe-audio] Transcription completed successfully, text length:', 
      transcription.text ? transcription.text.length : 0);
  } catch (error) {
    console.error('[transcribe-audio] Transcription error or timeout:', error);
    await progressTracker.markError(
      error instanceof Error ? 
        `Transcription error: ${error.message}` : 
        'Transcription failed'
    );
    throw error;
  }
  
  // Update recording and note with transcription
  try {
    await updateRecordingAndNote(supabase, recording.id, note.id, transcription.text);
    console.log('[transcribe-audio] Updated database with transcription');
    
    // Update progress to generating minutes stage
    await progressTracker.markGeneratingMinutes();
  } catch (error) {
    console.error('[transcribe-audio] Error updating database with transcription:', error);
    throw error;
  }

  // Start meeting minutes generation
  try {
    await startMeetingMinutesGeneration(supabase, note.id, transcription.text);
    
    // Ensure status is updated to completed with 100% progress
    await progressTracker.markCompleted();
    console.log('[transcribe-audio] Updated note status to completed after minutes generation');
  } catch (error) {
    console.error('[transcribe-audio] Error in meeting minutes generation:', error);
    // Even if minutes generation fails, mark the transcription as completed since we have the transcript
    await progressTracker.markCompleted();
    console.log('[transcribe-audio] Updated note status to completed despite minutes generation error');
  }
  
  return transcription.text;
}
