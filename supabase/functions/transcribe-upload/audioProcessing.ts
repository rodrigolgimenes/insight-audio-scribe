
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Function to process audio extraction from video in the background
export async function processAudioExtraction(
  supabase: any,
  recordingId: string,
  originalFilePath: string,
  audioFilePath: string,
  noteId: string
): Promise<void> {
  console.log('Starting audio extraction process for:', {
    recordingId,
    originalFilePath,
    audioFilePath
  });
  
  try {
    // Update status to show processing is happening
    await supabase
      .from('recordings')
      .update({
        status: 'extracting_audio',
        processing_message: 'Extracting audio from video file'
      })
      .eq('id', recordingId);
      
    await supabase
      .from('notes')
      .update({
        status: 'processing',
        processing_progress: 10,
        processing_message: 'Extracting audio from video file'
      })
      .eq('id', noteId);
    
    // Get the original file URL
    const { data: originalFileData } = await supabase.storage
      .from('audio_recordings')
      .getPublicUrl(originalFilePath);
    
    if (!originalFileData || !originalFileData.publicUrl) {
      throw new Error('Could not get public URL for original video file');
    }
    
    // Since we're removing the edge function, we're going to use the original file as the audio file temporarily
    // This is a simplification - in a real scenario you would need a proper audio extraction solution
    console.log('Using original file as temporary audio source');
    
    // Update recording with the processed audio URL
    await supabase
      .from('recordings')
      .update({
        audio_url: originalFileData.publicUrl,
        status: 'transcribing',
        processing_message: 'Starting transcription with original file'
      })
      .eq('id', recordingId);
      
    await supabase
      .from('notes')
      .update({
        status: 'processing',
        processing_progress: 30,
        processing_message: 'Starting transcription'
      })
      .eq('id', noteId);
    
    console.log('Audio extraction bypassed, starting transcription process');
    
    // Start transcription process
    const { error: transcribeError } = await supabase.functions
      .invoke('transcribe-audio', {
        body: { 
          noteId: noteId,
          recordingId: recordingId,
          audioUrl: originalFileData.publicUrl
        }
      });
    
    if (transcribeError) {
      throw new Error(`Failed to start transcription: ${transcribeError.message}`);
    }
    
    console.log('Transcription process started successfully');
    
  } catch (error) {
    console.error('Error during audio extraction:', error);
    
    // Update status to show the error
    await supabase
      .from('recordings')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error during audio extraction'
      })
      .eq('id', recordingId);
      
    await supabase
      .from('notes')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error during audio extraction'
      })
      .eq('id', noteId);
  }
}
