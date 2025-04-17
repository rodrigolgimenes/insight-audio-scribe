
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function updateRecordingStatus(supabase: any, recordingId: string, status: string, errorMessage?: string) {
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString()
  };
  
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }
  
  const { error } = await supabase
    .from('recordings')
    .update(updateData)
    .eq('id', recordingId);
    
  if (error) {
    console.error('[process-recording] Failed to update recording status:', error);
    throw new Error(`Failed to update recording status: ${error.message}`);
  }
}

export async function getRecordingData(supabase: any, recordingId: string) {
  const { data: recording, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', recordingId)
    .single();
    
  if (error) {
    console.error('[process-recording] Failed to get recording data:', error);
    throw new Error(`Failed to get recording data: ${error.message}`);
  }
  
  return recording;
}

export async function createOrGetNote(supabase: any, recordingId: string, recording: any, existingNoteId?: string) {
  if (existingNoteId) {
    // Get existing note
    const { data: existingNote, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', existingNoteId)
      .single();
      
    if (!error && existingNote) {
      return existingNote;
    }
    
    console.warn(`[process-recording] Could not find existing note ${existingNoteId}, creating new one`);
  }
  
  // Create new note
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      recording_id: recordingId,
      user_id: recording.user_id,
      title: recording.title || 'New Recording',
      processed_content: '',
      original_transcript: '',
      status: 'pending',
      processing_progress: 5
    })
    .select()
    .single();
    
  if (noteError) {
    console.error('[process-recording] Failed to create note:', noteError);
    throw new Error(`Failed to create note: ${noteError.message}`);
  }
  
  return note;
}

export async function updateNoteStatus(supabase: any, noteId: string, status: string, progress?: number, errorMessage?: string) {
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString()
  };
  
  if (progress !== undefined) {
    updateData.processing_progress = progress;
  }
  
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }
  
  const { error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', noteId);
    
  if (error) {
    console.error('[process-recording] Failed to update note status:', error);
  }
}

export async function handleProcessingError(supabase: any, recordingId: string, noteId: string, error: any) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  console.error('[process-recording] Processing error:', errorMessage);
  
  try {
    await Promise.all([
      updateRecordingStatus(supabase, recordingId, 'error', errorMessage),
      updateNoteStatus(supabase, noteId, 'error', 0, errorMessage)
    ]);
    
    // Add a processing log
    await supabase
      .from('processing_logs')
      .insert({
        recording_id: recordingId,
        note_id: noteId,
        stage: 'error',
        message: `Processing error: ${errorMessage}`,
        status: 'error'
      });
  } catch (updateError) {
    console.error('[process-recording] Failed to update error status:', updateError);
  }
}

export function checkFileSize(fileData: any[]): { isLargeFile: boolean, isExtremelyLargeFile: boolean } {
  if (!fileData || fileData.length === 0) {
    return { isLargeFile: false, isExtremelyLargeFile: false };
  }
  
  // Calculate total size
  let totalSize = 0;
  for (const file of fileData) {
    if (file.metadata && file.metadata.size) {
      totalSize += parseInt(file.metadata.size, 10);
    }
  }
  
  console.log(`[process-recording] File size check: ${totalSize} bytes (${Math.round(totalSize/1024/1024*100)/100} MB)`);
  
  const isLargeFile = totalSize > 23 * 1024 * 1024; // 23 MB
  const isExtremelyLargeFile = totalSize > 100 * 1024 * 1024; // 100 MB
  
  return { isLargeFile, isExtremelyLargeFile };
}
