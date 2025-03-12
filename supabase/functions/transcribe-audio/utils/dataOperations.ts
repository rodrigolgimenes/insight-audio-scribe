
import { VALID_NOTE_STATUSES, VALID_RECORDING_STATUSES } from '../constants.ts';

/**
 * Updates the note progress in a consistent way
 * @param supabase Supabase client
 * @param noteId Note ID
 * @param status Status
 * @param progress Progress percentage
 */
export async function updateNoteProgress(
  supabase: any, 
  noteId: string, 
  status: string, 
  progress: number
) {
  console.log(`[transcribe-audio] Updating note ${noteId} progress: status=${status}, progress=${progress}%`);
  
  // Validate status against allowed values to prevent constraint violations
  if (!VALID_NOTE_STATUSES.includes(status)) {
    console.error(`[transcribe-audio] Invalid status: ${status}. Using 'processing' instead.`);
    status = 'processing'; // Fallback to a safe default value
  }
  
  try {
    const { error } = await supabase
      .from('notes')
      .update({ 
        status,
        processing_progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);
      
    if (error) {
      console.error(`[transcribe-audio] Error updating note progress: ${error.message}`);
      throw new Error(`Failed to update note progress: ${error.message}`);
    }
    
    console.log('[transcribe-audio] Successfully updated note progress');
  } catch (error) {
    console.error('[transcribe-audio] Exception in updateNoteProgress:', error);
    throw error;
  }
}

/**
 * Updates the recording and note with transcription data
 * @param supabase Supabase client
 * @param recordingId Recording ID
 * @param noteId Note ID
 * @param transcriptionText Transcription text
 */
export async function updateRecordingAndNote(
  supabase: any,
  recordingId: string,
  noteId: string,
  transcriptionText: string
) {
  console.log(`[transcribe-audio] Updating recording ${recordingId} and note ${noteId} with transcription`);
  
  try {
    // Validate recording status
    let recordingStatus = 'completed';
    if (!VALID_RECORDING_STATUSES.includes(recordingStatus)) {
      console.error(`[transcribe-audio] Invalid recording status: ${recordingStatus}. Using 'processing' instead.`);
      recordingStatus = 'processing';
    }
    
    // Update the recording status
    const { error: recordingError } = await supabase
      .from('recordings')
      .update({ 
        status: recordingStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordingId);
      
    if (recordingError) {
      console.error(`[transcribe-audio] Error updating recording: ${recordingError.message}`);
      throw new Error(`Failed to update recording: ${recordingError.message}`);
    }
    
    // Validate note status - using "completed" which is definitely in our allowed list
    let noteStatus = 'completed';
    if (!VALID_NOTE_STATUSES.includes(noteStatus)) {
      console.error(`[transcribe-audio] Invalid note status: ${noteStatus}. Using 'processing' instead.`);
      noteStatus = 'processing';
    }
    
    // Update note with transcription text
    const { error: noteError } = await supabase
      .from('notes')
      .update({
        status: noteStatus,
        processing_progress: 80,
        original_transcript: transcriptionText,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);

    if (noteError) {
      console.error(`[transcribe-audio] Error updating note: ${noteError.message}`);
      throw new Error(`Failed to update note: ${noteError.message}`);
    }
    
    console.log('[transcribe-audio] Successfully updated recording and note with transcription');
  } catch (error) {
    console.error('[transcribe-audio] Exception in updateRecordingAndNote:', error);
    throw error;
  }
}

/**
 * Starts the meeting minutes generation process
 * @param supabase Supabase client
 * @param noteId Note ID
 * @param transcriptionText Transcription text
 */
export async function startMeetingMinutesGeneration(
  supabase: any,
  noteId: string,
  transcriptionText: string
) {
  console.log(`[transcribe-audio] Starting meeting minutes generation for note ${noteId}`);
  
  try {
    // Validate status before updating
    let status = 'generating_minutes';
    if (!VALID_NOTE_STATUSES.includes(status)) {
      console.error(`[transcribe-audio] Invalid status for minutes generation: ${status}. Using 'processing' instead.`);
      status = 'processing';
    }
    
    // Update note status to generating_minutes
    await updateNoteProgress(supabase, noteId, status, 80);
    
    // Invoke the generate-meeting-minutes function
    const { error } = await supabase.functions
      .invoke('generate-meeting-minutes', {
        body: { 
          noteId,
          transcript: transcriptionText
        }
      });
      
    if (error) {
      console.error(`[transcribe-audio] Error invoking meeting minutes generation: ${error.message}`);
      throw new Error(`Failed to generate meeting minutes: ${error.message}`);
    }
    
    console.log('[transcribe-audio] Meeting minutes generation started successfully');
  } catch (error) {
    console.error('[transcribe-audio] Exception in startMeetingMinutesGeneration:', error);
    throw error;
  }
}
