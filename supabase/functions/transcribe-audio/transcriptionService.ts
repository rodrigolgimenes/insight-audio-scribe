
import { supabase } from './supabaseClient.ts';
import { transcribeAudio } from './openaiClient.ts';
import { updateTranscriptionStatus } from './statusUpdater.ts';

export async function processTranscription(
  noteId: string,
  audioFile: Blob,
  isRetry: boolean = false
): Promise<string> {
  try {
    console.log('[transcribe-audio] Iniciando transcrição...');
    
    // Update status to processing
    await updateTranscriptionStatus(noteId, 'processing', 30);
    
    // Get recording id from note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('recording_id')
      .eq('id', noteId)
      .single();
      
    if (noteError) {
      console.error('[transcribe-audio] Error getting note:', noteError);
      throw noteError;
    }
    
    const recordingId = note.recording_id;
    
    // Start transcription
    const { task_id, text } = await transcribeAudio(audioFile);
    
    // If we get a task_id, save it directly to the recordings table
    if (task_id) {
      try {
        console.log('[transcribe-audio] Saving task_id to recording:', task_id);
        
        // Direct update approach - simpler and less error-prone
        const { error: updateError } = await supabase
          .from('recordings')
          .update({
            task_id: task_id,
            status: 'transcribing',
            updated_at: new Date().toISOString()
          })
          .eq('id', recordingId);
          
        if (updateError) {
          console.error('[transcribe-audio] Error saving task_id with direct update:', updateError);
          
          // As a last resort, log the values we're trying to save
          console.log('[transcribe-audio] Recording ID:', recordingId);
          console.log('[transcribe-audio] Task ID:', task_id);
          console.log('[transcribe-audio] Status:', 'transcribing');
        } else {
          console.log('[transcribe-audio] Successfully updated task_id with direct update');
        }
        
        // Update note status to transcribing and set initial progress
        await updateTranscriptionStatus(noteId, 'transcribing', 50);
        
        return 'Task created and queued for processing';
      } catch (dbError) {
        console.error('[transcribe-audio] Error saving task_id to recording:', dbError);
        // Continue execution instead of failing completely
        console.log('[transcribe-audio] Will continue with note status update despite recording update failure');
        
        // Still update note status to indicate processing is happening
        await updateTranscriptionStatus(noteId, 'transcribing', 50);
        
        // Return a message indicating partial success
        return 'Task created but recording update failed - processing will continue';
      }
    }
    
    // If we get text directly (rare case), update with the result directly
    if (text && text.length > 0) {
      await supabase
        .from('notes')
        .update({
          original_transcript: text,
          status: 'completed',
          processing_progress: 100
        })
        .eq('id', noteId);
        
      await supabase
        .from('recordings')
        .update({
          transcription: text,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordingId);
        
      return text;
    }
    
    throw new Error('No task ID or transcription text returned');
  } catch (error) {
    console.error('[transcribe-audio] Erro durante a transcrição:', error);
    throw error;
  }
}
