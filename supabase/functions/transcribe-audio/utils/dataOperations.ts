
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
    console.error(`[transcribe-audio] VALIDATION ERROR: Status "${status}" is not valid. Available statuses: ${VALID_NOTE_STATUSES.join(', ')}`);
    status = 'processing'; // Fallback to a safe default value
    console.log(`[transcribe-audio] Using safe fallback status: ${status}`);
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
        transcription: transcriptionText, // Ensure transcription is saved in recordings too
        updated_at: new Date().toISOString()
      })
      .eq('id', recordingId);
      
    if (recordingError) {
      console.error(`[transcribe-audio] Error updating recording: ${recordingError.message}`);
      throw new Error(`Failed to update recording: ${recordingError.message}`);
    }
    
    // IMPORTANT: Never use 'transcribed' status which isn't in VALID_NOTE_STATUSES
    // Instead use 'completed' which is a valid status
    let noteStatus = 'generating_minutes';
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
      console.warn(`[transcribe-audio] Invalid status for minutes generation: ${status}. Using 'processing' instead.`);
      status = 'processing';
    }
    
    // Update note status to generating_minutes
    await updateNoteProgress(supabase, noteId, status, 80);
    
    // Get the recording ID for the note to update both tables
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('recording_id')
      .eq('id', noteId)
      .single();
      
    if (noteError) {
      console.error(`[transcribe-audio] Error getting note data: ${noteError.message}`);
      throw noteError;
    }
    
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
      
      // Se houve erro ao gerar atas, devemos ainda marcar a nota como concluída
      console.log('[transcribe-audio] Marking note as completed despite minutes generation error');
      await updateNoteProgress(supabase, noteId, 'completed', 100);
      
      if (noteData?.recording_id) {
        // Também atualizar a gravação para concluída
        await supabase
          .from('recordings')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', noteData.recording_id);
      }
      
      throw new Error(`Failed to generate meeting minutes: ${error.message}`);
    }
    
    console.log('[transcribe-audio] Meeting minutes generation started successfully');
    
    // Set a timeout to check and update the status to completed if not already
    // This ensures we don't leave the status as "generating_minutes" even if the edge function completes
    setTimeout(async () => {
      try {
        // Check if the note is still in generating_minutes status
        const { data: currentStatus } = await supabase
          .from('notes')
          .select('status, processing_progress')
          .eq('id', noteId)
          .single();
          
        if (currentStatus) {
          console.log(`[transcribe-audio] Current note status: ${currentStatus.status}, progress: ${currentStatus.processing_progress}`);
          
          // Verificar se o status ainda não é 'completed'
          if (currentStatus.status !== 'completed') {
            console.log('[transcribe-audio] Note still not marked as completed, updating to completed');
            
            // Update note to completed
            await updateNoteProgress(supabase, noteId, 'completed', 100);
            
            // Also update the recording to completed
            if (noteData?.recording_id) {
              await supabase
                .from('recordings')
                .update({ 
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', noteData.recording_id);
            }
          }
        }
      } catch (error) {
        console.error('[transcribe-audio] Error in status check timeout:', error);
        
        // Mesmo com erro, tentar atualizar o status
        try {
          await updateNoteProgress(supabase, noteId, 'completed', 100);
        } catch (updateError) {
          console.error('[transcribe-audio] Failed to update note after error:', updateError);
        }
      }
    }, 15000); // Verificar após 15 segundos (reduzido de 30s para resposta mais rápida)
  } catch (error) {
    console.error('[transcribe-audio] Exception in startMeetingMinutesGeneration:', error);
    
    // Garantir que o erro não impede a conclusão da transcrição
    try {
      console.log('[transcribe-audio] Forcing note status to completed after minutes generation error');
      await updateNoteProgress(supabase, noteId, 'completed', 100);
    } catch (finalError) {
      console.error('[transcribe-audio] Fatal error updating note status:', finalError);
    }
    
    throw error;
  }
}
