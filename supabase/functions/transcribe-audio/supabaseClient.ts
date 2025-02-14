
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
    throw new Error('Recording not found');
  }

  return data;
}

export async function getNoteData(supabase: any, recordingId: string): Promise<NoteData> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('recording_id', recordingId)
    .single();

  if (error || !data) {
    throw new Error('Note not found');
  }

  return data;
}

export async function updateNoteStatus(
  supabase: any, 
  noteId: string, 
  status: string, 
  progress: number
) {
  await supabase
    .from('notes')
    .update({ 
      status,
      processing_progress: progress 
    })
    .eq('id', noteId);
}

export async function updateRecordingAndNote(
  supabase: any,
  recordingId: string,
  noteId: string,
  transcriptionText: string
) {
  await supabase.from('recordings')
    .update({
      status: 'completed',
      transcription: transcriptionText
    })
    .eq('id', recordingId);

  await supabase.from('notes')
    .update({
      status: 'completed',
      processing_progress: 100,
      original_transcript: transcriptionText
    })
    .eq('id', noteId);
}

export async function handleTranscriptionError(supabase: any, noteId: string) {
  await supabase
    .from('notes')
    .update({ 
      status: 'error',
      processing_progress: 0
    })
    .eq('id', noteId);
}
