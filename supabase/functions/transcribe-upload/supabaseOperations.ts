
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
  fileBlob: Blob,
) {
  const { error: uploadError } = await supabase.storage
    .from('audio_recordings')
    .upload(filePath, fileBlob, {
      contentType: 'audio/webm',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

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
    .select('user_id')
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
    });

  if (noteError) {
    console.error('Error creating note:', noteError);
    throw new Error(`Failed to create note: ${noteError.message}`);
  }
}
