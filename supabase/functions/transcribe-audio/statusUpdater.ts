
import { supabase } from './supabaseClient';

export async function updateTranscriptionStatus(
  noteId: string, 
  status: string, 
  progress: number,
  errorMessage?: string
): Promise<void> {
  try {
    console.log(`[ProgressTracker] Updating note ${noteId} status to ${status} with progress ${progress}%`);
    
    const updates: Record<string, any> = {
      status,
      processing_progress: progress
    };
    
    if (errorMessage) {
      updates.error_message = errorMessage;
    }
    
    await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId);
      
    console.log(`[ProgressTracker] Successfully updated note status to ${status} with progress ${progress}%`);
  } catch (error) {
    console.error('[ProgressTracker] Error updating note status:', error);
    throw error;
  }
}

export async function handleTranscriptionError(
  noteId: string,
  error: Error
): Promise<void> {
  try {
    await updateTranscriptionStatus(
      noteId,
      'error',
      0,
      error.message || 'Unknown error during transcription'
    );
  } catch (updateError) {
    console.error('[ProgressTracker] Error updating error status:', updateError);
  }
}
