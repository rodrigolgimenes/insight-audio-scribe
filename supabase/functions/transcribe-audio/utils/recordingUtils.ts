
import { RecordingData } from '../types.ts';

/**
 * Retrieves recording data from the database
 * @param supabase Supabase client
 * @param recordingId Recording ID
 * @returns Recording data
 */
export async function getRecordingData(supabase: any, recordingId: string): Promise<RecordingData> {
  console.log(`[transcribe-audio] Getting recording data for ID: ${recordingId}`);
  
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', recordingId)
    .single();

  if (error) {
    console.error(`[transcribe-audio] Error getting recording: ${error.message}`);
    throw new Error(`Recording not found: ${error.message}`);
  }

  if (!data) {
    console.error(`[transcribe-audio] Recording not found with ID: ${recordingId}`);
    throw new Error(`Recording not found with ID: ${recordingId}`);
  }

  console.log(`[transcribe-audio] Found recording with file_path: ${data.file_path}`);
  return data;
}

/**
 * Updates recording with transcription
 * @param supabase Supabase client
 * @param recordingId Recording ID
 * @param transcriptionText Transcription text
 */
export async function updateRecording(
  supabase: any,
  recordingId: string,
  transcriptionText: string
) {
  console.log(`[transcribe-audio] Updating recording ${recordingId} with transcription`);
  
  const { error } = await supabase
    .from('recordings')
    .update({
      status: 'completed',
      transcription: transcriptionText
    })
    .eq('id', recordingId);

  if (error) {
    console.error(`[transcribe-audio] Error updating recording: ${error.message}`);
    throw new Error(`Failed to update recording: ${error.message}`);
  }
  
  console.log('[transcribe-audio] Successfully updated recording with transcription');
}
