
import { NoteData } from '../types.ts';
import { VALID_NOTE_STATUSES } from '../constants.ts';

/**
 * Retrieves note data from the database
 * @param supabase Supabase client
 * @param noteIdOrRecordingId Note ID or Recording ID
 * @param isNoteId Whether the provided ID is a Note ID
 * @returns Note data
 */
export async function getNoteData(
  supabase: any, 
  noteIdOrRecordingId: string,
  isNoteId = false
): Promise<NoteData> {
  const idType = isNoteId ? 'ID' : 'recording ID';
  console.log(`[transcribe-audio] Getting note data for ${idType}: ${noteIdOrRecordingId}`);
  
  const query = supabase
    .from('notes')
    .select('*');
    
  if (isNoteId) {
    query.eq('id', noteIdOrRecordingId);
  } else {
    query.eq('recording_id', noteIdOrRecordingId);
  }
  
  const { data, error } = await query.single();

  if (error) {
    console.error(`[transcribe-audio] Error getting note: ${error.message}`);
    throw new Error(`Note not found: ${error.message}`);
  }

  if (!data) {
    console.error(`[transcribe-audio] Note not found for ${idType}: ${noteIdOrRecordingId}`);
    throw new Error(`Note not found for ${idType}: ${noteIdOrRecordingId}`);
  }

  console.log(`[transcribe-audio] Found note with ID: ${data.id}`);
  return data;
}

/**
 * Updates note status and progress
 * @param supabase Supabase client
 * @param noteId Note ID
 * @param status Status
 * @param progress Progress percentage
 */
export async function updateNoteStatus(
  supabase: any, 
  noteId: string, 
  status: string, 
  progress: number
) {
  console.log(`[transcribe-audio] Updating note ${noteId} status to ${status} with progress ${progress}%`);
  
  try {
    // Triple validation of status against allowed values
    if (!VALID_NOTE_STATUSES.includes(status)) {
      console.error(`[transcribe-audio] VALIDATION ERROR: Status "${status}" is not valid. Available statuses: ${VALID_NOTE_STATUSES.join(', ')}`);
      status = 'processing'; // Fallback to a safe default value
      console.log(`[transcribe-audio] Using safe fallback status: ${status}`);
    }
    
    const { error } = await supabase
      .from('notes')
      .update({ 
        status,
        processing_progress: progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);
      
    if (error) {
      console.error(`[transcribe-audio] Error updating note status: ${error.message}`);
      throw new Error(`Failed to update note status: ${error.message}`);
    }
    
    console.log(`[transcribe-audio] Successfully updated note status to ${status} with progress ${progress}%`);
  } catch (error) {
    console.error(`[transcribe-audio] Exception in updateNoteStatus:`, error);
    throw error;
  }
}

/**
 * Updates note with transcription
 * @param supabase Supabase client
 * @param noteId Note ID
 * @param transcriptionText Transcription text
 */
export async function updateNote(
  supabase: any,
  noteId: string,
  transcriptionText: string
) {
  console.log(`[transcribe-audio] Updating note ${noteId} with transcription`);
  
  try {
    // First check if the note already has a transcript
    const { data: existingNote } = await supabase
      .from('notes')
      .select('original_transcript')
      .eq('id', noteId)
      .single();
      
    if (existingNote?.original_transcript) {
      console.log('[transcribe-audio] Note already has transcript. Checking if we should overwrite...');
      
      // Only overwrite if the existing transcript is empty or very short
      if (!existingNote.original_transcript.trim() || existingNote.original_transcript.length < 20) {
        console.log('[transcribe-audio] Existing transcript is empty or very short. Overwriting...');
      } else {
        console.log('[transcribe-audio] Existing transcript seems valid. Not overwriting.');
        return;
      }
    }
    
    // Validate status before update - using generating_minutes which is valid
    let status = 'generating_minutes';
    if (!VALID_NOTE_STATUSES.includes(status)) {
      console.error(`[transcribe-audio] VALIDATION ERROR: Status "${status}" is not valid. Available statuses: ${VALID_NOTE_STATUSES.join(', ')}`);
      status = 'processing'; // Fallback to a safe default value
      console.log(`[transcribe-audio] Using safe fallback status: ${status}`);
    }
    
    const { error } = await supabase
      .from('notes')
      .update({
        status,
        processing_progress: 75,
        original_transcript: transcriptionText,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);

    if (error) {
      console.error(`[transcribe-audio] Error updating note: ${error.message}`);
      throw new Error(`Failed to update note: ${error.message}`);
    }
    
    console.log('[transcribe-audio] Successfully updated note with transcription');
  } catch (error) {
    console.error('[transcribe-audio] Exception in updateNote:', error);
    throw error;
  }
}

/**
 * Handles errors during transcription
 * @param supabase Supabase client
 * @param noteId Note ID
 * @param errorMessage Error message
 */
export async function handleTranscriptionError(
  supabase: any, 
  noteId: string, 
  errorMessage?: string
) {
  console.log(`[transcribe-audio] Handling transcription error for note ${noteId}`);
  
  try {
    // Validate status before update to ensure it's in the allowed list
    let status = 'error';
    if (!VALID_NOTE_STATUSES.includes(status)) {
      console.error(`[transcribe-audio] Invalid error status: ${status}. Using 'processing' instead.`);
      status = 'processing';
    }
    
    const { error } = await supabase
      .from('notes')
      .update({ 
        status,
        processing_progress: 0,
        error_message: errorMessage || 'An error occurred during transcription',
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);
      
    if (error) {
      console.error(`[transcribe-audio] Error updating note error status: ${error.message}`);
    }
  } catch (updateError) {
    console.error('[transcribe-audio] Error during error handling:', updateError);
  }
}
