
import { supabase } from "@/integrations/supabase/client";

export const createRecordingEntry = async (
  userId: string,
  title: string,
  filePath: string,
  durationInMs: number
) => {
  console.log('Creating initial recording entry with duration:', durationInMs);
  
  const { error: dbError, data: recordingData } = await supabase
    .from('recordings')
    .insert({
      user_id: userId,
      title: title || `Recording ${new Date().toLocaleString()}`,
      file_path: filePath,
      status: 'pending',
      duration: durationInMs // Save duration in milliseconds
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Error creating record: ${dbError.message}`);
  }
  
  console.log('Recording entry created:', recordingData);
  return recordingData;
};

export const updateRecordingStatus = async (recordingId: string, status: string) => {
  const { error: updateError } = await supabase
    .from('recordings')
    .update({ status })
    .eq('id', recordingId);

  if (updateError) {
    throw new Error(`Error updating recording status: ${updateError.message}`);
  }
};

export const createInitialNote = async (
  title: string,
  recordingId: string,
  userId: string,
  durationInMs: number
) => {
  const { error: noteError } = await supabase
    .from('notes')
    .insert({
      title,
      recording_id: recordingId,
      user_id: userId,
      status: 'pending',
      processing_progress: 0,
      processed_content: '',
      duration: durationInMs // Explicitly set the duration in the notes table too
    });

  if (noteError) {
    console.error('Error creating note:', noteError);
    throw new Error(`Failed to create note: ${noteError.message}`);
  }
};

export const startRecordingProcessing = async (recordingId: string) => {
  try {
    return await supabase.functions
      .invoke('process-recording', {
        body: { recordingId }
      });
  } catch (error) {
    console.error('Error invoking process-recording function:', error);
    throw error;
  }
};
