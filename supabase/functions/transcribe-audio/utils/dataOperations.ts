
import { updateRecording } from './recordingUtils.ts';
import { updateNote } from './noteUtils.ts';

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
  
  // Update recording first
  await updateRecording(supabase, recordingId, transcriptionText);
  
  // Then update note
  await updateNote(supabase, noteId, transcriptionText);
  
  console.log('[transcribe-audio] Successfully updated recording and note with transcription');
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
    const { error: minutesError } = await supabase.functions
      .invoke('generate-meeting-minutes', {
        body: { 
          noteId: noteId,
          transcription: transcriptionText
        }
      });

    if (minutesError) {
      console.error('[transcribe-audio] Error starting meeting minutes generation:', minutesError);
      // Don't throw here, we already have the transcription
    }
  } catch (error) {
    console.error('[transcribe-audio] Error invoking meeting minutes function:', error);
    // Continue anyway, the transcription part is complete
  }
}
