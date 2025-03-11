
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { RecordingData, NoteData } from './types.ts';

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

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

export async function getNoteData(supabase: any, recordingId: string): Promise<NoteData> {
  console.log(`[transcribe-audio] Getting note data for recording ID: ${recordingId}`);
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('recording_id', recordingId)
    .single();

  if (error) {
    console.error(`[transcribe-audio] Error getting note: ${error.message}`);
    throw new Error(`Note not found: ${error.message}`);
  }

  if (!data) {
    console.error(`[transcribe-audio] Note not found for recording: ${recordingId}`);
    throw new Error(`Note not found for recording: ${recordingId}`);
  }

  console.log(`[transcribe-audio] Found note with ID: ${data.id}`);
  return data;
}

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

export async function updateRecordingAndNote(
  supabase: any,
  recordingId: string,
  noteId: string,
  transcriptionText: string
) {
  console.log(`[transcribe-audio] Updating recording ${recordingId} and note ${noteId} with transcription`);
  
  // Update recording first
  const { error: recordingError } = await supabase
    .from('recordings')
    .update({
      status: 'completed',
      transcription: transcriptionText
    })
    .eq('id', recordingId);

  if (recordingError) {
    console.error(`[transcribe-audio] Error updating recording: ${recordingError.message}`);
    throw new Error(`Failed to update recording: ${recordingError.message}`);
  }

  // Then update note
  const { error: noteError } = await supabase
    .from('notes')
    .update({
      status: 'generating_minutes',
      processing_progress: 75,
      original_transcript: transcriptionText
    })
    .eq('id', noteId);

  if (noteError) {
    console.error(`[transcribe-audio] Error updating note: ${noteError.message}`);
    throw new Error(`Failed to update note: ${noteError.message}`);
  }
  
  console.log('[transcribe-audio] Successfully updated recording and note with transcription');
}

export async function handleTranscriptionError(supabase: any, noteId: string, errorMessage?: string) {
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
