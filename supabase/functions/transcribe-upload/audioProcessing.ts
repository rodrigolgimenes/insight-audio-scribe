
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
    
    console.log('Fetching original video file from:', originalFileData.publicUrl);
    
    // Download the original file
    const response = await fetch(originalFileData.publicUrl);
    if (!response.ok) {
      throw new Error(`Failed to download original file: ${response.status} ${response.statusText}`);
    }
    
    // Get the video data
    const videoBlob = await response.blob();
    console.log('Downloaded video file, size:', videoBlob.size);
    
    // Call our audio extraction edge function
    console.log('Calling audio-extract edge function...');
    
    const { data: extractionData, error: extractionError } = await supabase.functions
      .invoke('audio-extract', {
        body: { 
          videoUrl: originalFileData.publicUrl,
          outputPath: audioFilePath,
          recordingId: recordingId,
          noteId: noteId
        }
      });
    
    if (extractionError) {
      throw new Error(`Audio extraction failed: ${extractionError.message}`);
    }
    
    if (!extractionData || !extractionData.success) {
      throw new Error('Audio extraction failed without specific error');
    }
    
    console.log('Audio extraction completed successfully:', extractionData);
    
    // Get the audio file URL
    const { data: audioFileData } = await supabase.storage
      .from('audio_recordings')
      .getPublicUrl(audioFilePath);
    
    if (!audioFileData || !audioFileData.publicUrl) {
      throw new Error('Could not get public URL for processed audio file');
    }
    
    // Update recording with the processed audio URL
    await supabase
      .from('recordings')
      .update({
        audio_url: audioFileData.publicUrl,
        status: 'transcribing',
        processing_message: 'Audio extracted successfully'
      })
      .eq('id', recordingId);
      
    await supabase
      .from('notes')
      .update({
        status: 'processing',
        processing_progress: 30,
        processing_message: 'Audio extracted, starting transcription'
      })
      .eq('id', noteId);
    
    console.log('Audio extraction completed, starting transcription process');
    
    // Start transcription process
    const { error: transcribeError } = await supabase.functions
      .invoke('transcribe-audio', {
        body: { 
          noteId: noteId,
          recordingId: recordingId,
          audioUrl: audioFileData.publicUrl
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
