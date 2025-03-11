
import { updateNoteStatus } from '../supabaseClient.ts';

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
    // First update the note to generating_minutes status with 80% progress
    await updateNoteProgress(supabase, noteId, 'generating_minutes', 80);
    
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
