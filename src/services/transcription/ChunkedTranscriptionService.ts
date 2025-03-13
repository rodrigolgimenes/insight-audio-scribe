
import { supabase } from "@/integrations/supabase/client";

interface TranscriptionResult {
  success: boolean;
  error?: string;
  noteId?: string;
}

type ProgressCallback = (progress: number, stage: string) => void;

class ChunkedTranscriptionService {
  async transcribeAudio(
    recordingId: string,
    audioBlob: Blob,
    durationInSeconds: number,
    onProgress?: ProgressCallback
  ): Promise<TranscriptionResult> {
    try {
      // Report initial progress
      onProgress?.(10, "Preparing audio...");
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Generate a unique file path
      const fileName = `${user.id}/${Date.now()}.mp3`;
      
      // Upload the audio file
      onProgress?.(20, "Uploading audio...");
      
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mp3',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }
      
      // Update the recording with the file path
      onProgress?.(30, "Updating recording...");
      
      const { error: updateError } = await supabase
        .from('recordings')
        .update({ 
          file_path: fileName,
          status: 'uploaded'
        })
        .eq('id', recordingId);
        
      if (updateError) {
        throw new Error(`Failed to update recording: ${updateError.message}`);
      }
      
      // Create a note for this recording
      onProgress?.(40, "Creating note...");
      
      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          recording_id: recordingId,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: Math.round(durationInSeconds * 1000)
        })
        .select()
        .single();
        
      if (noteError) {
        throw new Error(`Failed to create note: ${noteError.message}`);
      }
      
      // Start transcription process
      onProgress?.(50, "Starting transcription...");
      
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { 
            recordingId,
            noteId: noteData.id
          },
        });
        
      if (processError) {
        console.error('Processing error:', processError);
        return {
          success: false,
          error: `Transcription failed to start: ${processError.message}`,
          noteId: noteData.id
        };
      }
      
      // Set up progress tracking
      onProgress?.(60, "Transcribing audio...");
      
      // Poll for updates
      let attempts = 0;
      const maxAttempts = 5;
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const { data: noteStatus } = await supabase
          .from('notes')
          .select('status, processing_progress')
          .eq('id', noteData.id)
          .single();
          
        if (noteStatus) {
          if (noteStatus.status === 'completed') {
            onProgress?.(100, "Transcription complete!");
            return {
              success: true,
              noteId: noteData.id
            };
          } else if (noteStatus.status === 'error') {
            return {
              success: false,
              error: "Transcription service encountered an error",
              noteId: noteData.id
            };
          } else if (noteStatus.processing_progress > 0) {
            onProgress?.(60 + (noteStatus.processing_progress * 0.4), `Transcribing... ${noteStatus.processing_progress}%`);
          }
        }
        
        attempts++;
      }
      
      // If we get here, transcription is still in progress
      onProgress?.(80, "Transcription in progress...");
      
      return {
        success: true,
        noteId: noteData.id
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during transcription"
      };
    }
  }
}

export const chunkedTranscriptionService = new ChunkedTranscriptionService();
