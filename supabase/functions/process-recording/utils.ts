
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { NoteData, RecordingData } from "./types.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function getRecordingData(supabase: any, recordingId: string): Promise<RecordingData> {
  console.log('[process-recording] Fetching recording data:', recordingId);
  
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', recordingId)
    .single();

  if (error || !data) {
    console.error('[process-recording] Error fetching recording:', error);
    throw new Error('Recording not found');
  }

  return data;
}

export async function updateRecordingStatus(supabase: any, recordingId: string, status: string) {
  const { error } = await supabase
    .from('recordings')
    .update({ status })
    .eq('id', recordingId);

  if (error) {
    console.error('[process-recording] Error updating status:', error);
    throw new Error('Failed to update recording status');
  }
}

export async function createOrGetNote(
  supabase: any, 
  recordingId: string, 
  recording: RecordingData, 
  existingNoteId?: string
): Promise<NoteData> {
  // If a note ID was provided, verify it exists and is linked to this recording
  if (existingNoteId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', existingNoteId)
        .eq('recording_id', recordingId)
        .single();
        
      if (!error) {
        console.log('[process-recording] Verified existing note:', data.id);
        return data;
      }
      
      console.error('[process-recording] Error verifying note:', error);
      console.log('[process-recording] Will create a new note instead');
    } catch (error) {
      console.error('[process-recording] Exception verifying note:', error);
    }
  }

  // Create or get existing note
  const { data, error } = await supabase
    .from('notes')
    .upsert({
      title: recording.title,
      recording_id: recordingId,
      user_id: recording.user_id,
      duration: recording.duration,
      processed_content: '', 
      status: 'processing',
      processing_progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'recording_id',
      ignoreDuplicates: true
    })
    .select()
    .single();

  if (error) {
    console.error('[process-recording] Error creating/getting note:', error);
    throw new Error('Failed to create/get note');
  }

  if (!data) {
    throw new Error('Could not create or retrieve note');
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
    console.error('[process-recording] Error updating note status:', error);
  }
}

export async function handleProcessingError(
  supabase: any,
  recordingId: string,
  noteId: string,
  error: Error
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
  
  console.error('[process-recording] Processing error:', errorMessage);
  
  try {
    await Promise.all([
      supabase
        .from('recordings')
        .update({ 
          status: 'error',
          error_message: errorMessage
        })
        .eq('id', recordingId),
      supabase
        .from('notes')
        .update({ 
          status: 'error',
          processing_progress: 0,
          error_message: errorMessage
        })
        .eq('id', noteId)
    ]);
  } catch (updateError) {
    console.error('[process-recording] Error updating status after error:', updateError);
  }
}

export function checkFileSize(fileData: any[]): { fileSize: number, isLargeFile: boolean, isExtremelyLargeFile: boolean } {
  let fileSize = 0;
  
  if (fileData && fileData.length > 0) {
    fileSize = fileData[0].metadata?.size || 0;
    console.log('[process-recording] File size:', fileSize, 'bytes', `(${Math.round(fileSize/1024/1024*100)/100} MB)`);
  }
  
  // Adjust thresholds for better detection of large files
  // OpenAI Whisper has a limit of about 25MB
  const isLargeFile = fileSize > 8 * 1024 * 1024; // More than 8MB
  
  // Files that are SIGNIFICANTLY large need special chunking
  const isExtremelyLargeFile = fileSize > 15 * 1024 * 1024; // More than 15MB
  
  console.log(`[process-recording] File size classification: Large: ${isLargeFile}, Extremely large: ${isExtremelyLargeFile}`);
  
  return { fileSize, isLargeFile, isExtremelyLargeFile };
}
