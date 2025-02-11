
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
  fileBlob: Blob,
) {
  // Primeiro, verifica se o arquivo já existe
  const { data: existingFiles, error: listError } = await supabase.storage
    .from('audio_recordings')
    .list(filePath.split('/')[0], {
      limit: 1,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
      search: filePath.split('/')[1]
    });

  if (listError) {
    console.error('Error checking existing file:', listError);
    throw new Error(`Failed to check existing file: ${listError.message}`);
  }

  // Se o arquivo já existe, exclui antes de fazer o upload
  if (existingFiles && existingFiles.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from('audio_recordings')
      .remove([filePath]);

    if (deleteError) {
      console.error('Error deleting existing file:', deleteError);
      throw new Error(`Failed to delete existing file: ${deleteError.message}`);
    }
  }

  // Faz o upload do novo arquivo
  const { error: uploadError } = await supabase.storage
    .from('audio_recordings')
    .upload(filePath, fileBlob, {
      contentType: fileBlob.type,
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Retorna a URL pública do arquivo
  return supabase.storage
    .from('audio_recordings')
    .getPublicUrl(filePath);
}

export async function updateRecordingWithTranscription(
  supabase: ReturnType<typeof createClient>,
  recordingId: string,
  transcriptionText: string,
  processedContent: string
) {
  const { error: finalUpdateError } = await supabase
    .from('recordings')
    .update({
      transcription: transcriptionText,
      summary: processedContent,
      status: 'completed'
    })
    .eq('id', recordingId);

  if (finalUpdateError) {
    console.error('Error updating recording:', finalUpdateError);
    throw new Error(`Failed to update recording: ${finalUpdateError.message}`);
  }
}

export async function createNoteFromTranscription(
  supabase: ReturnType<typeof createClient>,
  recordingId: string,
  transcriptionText: string,
  processedContent: string
) {
  const { data: recordingData } = await supabase
    .from('recordings')
    .select('user_id, file_path, duration')
    .eq('id', recordingId)
    .single();

  if (!recordingData) {
    throw new Error('Recording not found');
  }

  const { error: noteError } = await supabase
    .from('notes')
    .insert({
      user_id: recordingData.user_id,
      recording_id: recordingId,
      title: `Note from ${new Date().toLocaleString()}`,
      processed_content: processedContent,
      original_transcript: transcriptionText,
      audio_url: recordingData.file_path,
      duration: recordingData.duration
    });

  if (noteError) {
    console.error('Error creating note:', noteError);
    throw new Error(`Failed to create note: ${noteError.message}`);
  }
}
