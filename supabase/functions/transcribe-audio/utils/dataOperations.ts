
import { updateRecording } from './recordingUtils.ts';
import { updateNote, getNoteData } from './noteUtils.ts';

/**
 * Updates both recording and note with transcription data
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
    // First verify the note exists
    await getNoteData(supabase, noteId, true);
    
    // Update recording first
    await updateRecording(supabase, recordingId, transcriptionText);
    
    // Then update note
    await updateNote(supabase, noteId, transcriptionText);
    
    console.log('[transcribe-audio] Successfully updated recording and note with transcription');
  } catch (error) {
    console.error('[transcribe-audio] Error in updateRecordingAndNote:', error);
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
  console.log('[transcribe-audio] Starting meeting minutes generation...');
  try {
    // First verify the note exists
    await getNoteData(supabase, noteId, true);
    
    const { error: minutesError } = await supabase.functions
      .invoke('generate-meeting-minutes', {
        body: { 
          noteId: noteId,
          transcription: transcriptionText
        }
      });

    if (minutesError) {
      console.error('[transcribe-audio] Error starting meeting minutes generation:', minutesError);
      throw minutesError;
    }
    
    console.log('[transcribe-audio] Successfully initiated meeting minutes generation');
    return true;
  } catch (error) {
    console.error('[transcribe-audio] Error invoking meeting minutes function:', error);
    throw error;
  }
}

/**
 * Verifies recording and note exist and are linked correctly
 * @param supabase Supabase client
 * @param recordingId Recording ID
 * @param noteId Note ID
 * @returns true if verification passes
 */
export async function verifyRecordingAndNoteLink(
  supabase: any,
  recordingId: string,
  noteId: string
) {
  console.log(`[transcribe-audio] Verifying recording ${recordingId} and note ${noteId} link`);
  
  try {
    // Check if note exists and has the correct recording ID
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();
      
    if (noteError || !note) {
      console.error('[transcribe-audio] Note verification failed:', noteError || 'Note not found');
      return false;
    }
    
    if (note.recording_id !== recordingId) {
      console.error('[transcribe-audio] Note is linked to a different recording:', note.recording_id);
      return false;
    }
    
    // Check if recording exists
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();
      
    if (recordingError || !recording) {
      console.error('[transcribe-audio] Recording verification failed:', recordingError || 'Recording not found');
      return false;
    }
    
    console.log('[transcribe-audio] Successfully verified recording and note link');
    return true;
  } catch (error) {
    console.error('[transcribe-audio] Error in verifyRecordingAndNoteLink:', error);
    return false;
  }
}
