
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
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', recordingId)
    .single();

  if (error || !data) {
    throw new Error(`Recording not found: ${error?.message || 'No data returned'}`);
  }

  return data;
}

export async function createNote(supabase: any, recordingData: RecordingData): Promise<NoteData> {
  console.log('[supabaseClient] Creating new note for recording:', recordingData.id);
  
  const { data, error } = await supabase
    .from('notes')
    .insert({
      recording_id: recordingData.id,
      user_id: recordingData.user_id,
      title: recordingData.title,
      status: 'pending',
      processing_progress: 0,
      processed_content: ''
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create note: ${error?.message || 'No data returned'}`);
  }

  console.log('[supabaseClient] Note created successfully:', data.id);
  return data;
}

export async function getNoteData(supabase: any, recordingId: string): Promise<NoteData> {
  console.log('[supabaseClient] Fetching note for recording:', recordingId);
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('recording_id', recordingId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error fetching note: ${error.message}`);
  }

  if (!data) {
    console.log('[supabaseClient] No existing note found, will create new one');
    const recording = await getRecordingData(supabase, recordingId);
    return await createNote(supabase, recording);
  }

  return data;
}

export async function updateNoteStatus(
  supabase: any, 
  noteId: string, 
  status: string, 
  progress: number
) {
  const { error } = await supabase
    .from('notes')
    .update({ 
      status,
      processing_progress: progress 
    })
    .eq('id', noteId);

  if (error) {
    throw new Error(`Failed to update note status: ${error.message}`);
  }
}

export async function updateRecordingAndNote(
  supabase: any,
  recordingId: string,
  noteId: string,
  transcriptionText: string
) {
  const { error: recordingError } = await supabase
    .from('recordings')
    .update({
      status: 'completed',
      transcription: transcriptionText
    })
    .eq('id', recordingId);

  if (recordingError) {
    throw new Error(`Failed to update recording: ${recordingError.message}`);
  }

  const { error: noteError } = await supabase
    .from('notes')
    .update({
      status: 'completed',
      processing_progress: 100,
      original_transcript: transcriptionText
    })
    .eq('id', noteId);

  if (noteError) {
    throw new Error(`Failed to update note: ${noteError.message}`);
  }
}

export async function handleTranscriptionError(supabase: any, noteId: string) {
  const { error } = await supabase
    .from('notes')
    .update({ 
      status: 'error',
      processing_progress: 0
    })
    .eq('id', noteId);

  if (error) {
    console.error('[supabaseClient] Failed to update note error status:', error);
  }
}
