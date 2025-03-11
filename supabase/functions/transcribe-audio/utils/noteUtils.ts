
import { NoteData } from '../types.ts';

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
  
  const { error } = await supabase
    .from('notes')
    .update({ 
      status,
      processing_progress: progress 
    })
    .eq('id', noteId);
    
  if (error) {
    console.error(`[transcribe-audio] Error updating note status: ${error.message}`);
    throw new Error(`Failed to update note status: ${error.message}`);
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
  
  const { error } = await supabase
    .from('notes')
    .update({
      status: 'generating_minutes',
      processing_progress: 75,
      original_transcript: transcriptionText
    })
    .eq('id', noteId);

  if (error) {
    console.error(`[transcribe-audio] Error updating note: ${error.message}`);
    throw new Error(`Failed to update note: ${error.message}`);
  }
  
  console.log('[transcribe-audio] Successfully updated note with transcription');
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
    const { error } = await supabase
      .from('notes')
      .update({ 
        status: 'error',
        processing_progress: 0,
        error_message: errorMessage || 'An error occurred during transcription'
      })
      .eq('id', noteId);
      
    if (error) {
      console.error(`[transcribe-audio] Error updating note error status: ${error.message}`);
    }
  } catch (updateError) {
    console.error('[transcribe-audio] Error during error handling:', updateError);
  }
}
