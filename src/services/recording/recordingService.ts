
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
    console.error('Error creating recording entry:', dbError);
    throw new Error(`Error creating record: ${dbError.message}`);
  }
  
  console.log('Recording entry created:', recordingData);
  return recordingData;
};

export const updateRecordingStatus = async (recordingId: string, status: string) => {
  console.log(`Updating recording status to ${status} for ID ${recordingId}`);
  
  const { error: updateError } = await supabase
    .from('recordings')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordingId);

  if (updateError) {
    console.error('Error updating recording status:', updateError);
    throw new Error(`Error updating recording status: ${updateError.message}`);
  }
  
  console.log('Recording status updated successfully');
};

export const createInitialNote = async (
  title: string,
  recordingId: string,
  userId: string,
  durationInMs: number
) => {
  console.log('Creating initial note with duration:', durationInMs);
  
  try {
    // Check if a note already exists for this recording
    const { data: existingNote } = await supabase
      .from('notes')
      .select('id')
      .eq('recording_id', recordingId)
      .maybeSingle();
      
    if (existingNote) {
      console.log('Note already exists for this recording, updating instead');
      
      const { error: updateError } = await supabase
        .from('notes')
        .update({
          title,
          status: 'pending',
          processing_progress: 0,
          error_message: null,
          duration: durationInMs,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingNote.id);
        
      if (updateError) {
        console.error('Error updating existing note:', updateError);
        throw updateError;
      }
      
      console.log('Existing note updated successfully');
      return;
    }
    
    // Create new note
    const { error: noteError } = await supabase
      .from('notes')
      .insert({
        title,
        recording_id: recordingId,
        user_id: userId,
        status: 'pending',
        processing_progress: 0,
        processed_content: '',
        duration: durationInMs, // Explicitly set the duration in the notes table too
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw new Error(`Failed to create note: ${noteError.message}`);
    }
    
    console.log('New note created successfully');
  } catch (error) {
    console.error('Error in createInitialNote:', error);
    throw error;
  }
};

export const startRecordingProcessing = async (recordingId: string) => {
  console.log('Starting recording processing for ID:', recordingId);
  
  try {
    const result = await supabase.functions
      .invoke('process-recording', {
        body: { recordingId }
      });
      
    console.log('Processing started with result:', result);
    return result;
  } catch (error) {
    console.error('Error invoking process-recording function:', error);
    throw error;
  }
};
