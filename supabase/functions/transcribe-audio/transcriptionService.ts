
import { supabase } from './supabaseClient';
import { transcribeAudio } from './openaiClient';
import { updateTranscriptionStatus } from './statusUpdater';

export async function processTranscription(
  noteId: string,
  audioFile: Blob,
  isRetry: boolean = false
): Promise<string> {
  try {
    console.log('[transcribe-audio] Iniciando transcrição...');
    
    // Update status to processing
    await updateTranscriptionStatus(noteId, 'processing', 30);
    
    // Start transcription
    const { task_id, text } = await transcribeAudio(audioFile);
    
    // If we get a task_id, save it to the database for later checking
    if (task_id) {
      try {
        console.log('[transcribe-audio] Creating transcription task for later processing:', task_id);
        
        await supabase
          .from('transcription_tasks')
          .insert({
            note_id: noteId,
            task_id: task_id,
            status: 'pending',
            created_at: new Date().toISOString(),
            last_checked_at: new Date().toISOString()
          });
        
        // Update note status to transcribing and set initial progress
        await updateTranscriptionStatus(noteId, 'transcribing', 50);
        
        return 'Task created and queued for processing';
      } catch (dbError) {
        console.error('[transcribe-audio] Error saving transcription task:', dbError);
        throw dbError;
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
        
      return text;
    }
    
    throw new Error('No task ID or transcription text returned');
  } catch (error) {
    console.error('[transcribe-audio] Erro durante a transcrição:', error);
    throw error;
  }
}
