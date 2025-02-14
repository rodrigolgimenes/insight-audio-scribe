
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useRecordingSave = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const saveRecording = async (
    isRecording: boolean,
    handleStopRecording: () => Promise<void>,
    mediaStream: MediaStream | null,
    audioUrl: string | null
  ) => {
    try {
      if (isRecording) {
        await handleStopRecording();
      }

      setIsProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Sanitize filename to prevent issues
      const fileName = `${user.id}/${Date.now()}.webm`.replace(/[^\x00-\x7F]/g, '');
      
      console.log('Creating recording with user ID:', user.id);

      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

      // Create initial recording entry
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: 0,
          file_path: fileName,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      console.log('Recording entry created:', recordingData);

      if (audioUrl) {
        const response = await fetch(audioUrl);
        const blob = await response.blob();

        // Upload with retries
        let uploadAttempts = 0;
        const maxAttempts = 3;
        let uploadError = null;

        while (uploadAttempts < maxAttempts) {
          try {
            const { error } = await supabase.storage
              .from('audio_recordings')
              .upload(fileName, blob, {
                contentType: 'audio/webm',
                upsert: false
              });

            if (!error) {
              uploadError = null;
              break;
            }
            uploadError = error;
          } catch (error) {
            uploadError = error;
          }
          uploadAttempts++;
          if (uploadAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        }

        if (uploadError) {
          // Clean up the recording entry if upload fails
          await supabase
            .from('recordings')
            .delete()
            .eq('id', recordingData.id);
          throw new Error(`Failed to upload audio: ${uploadError.message}`);
        }

        // Update recording status after successful upload
        const { error: updateError } = await supabase
          .from('recordings')
          .update({
            file_path: fileName,
            status: 'transcribing'
          })
          .eq('id', recordingData.id);

        if (updateError) {
          throw new Error(`Failed to update recording: ${updateError.message}`);
        }

        // Create note directly here instead of using process-recording
        const { data: note, error: noteError } = await supabase
          .from('notes')
          .insert({
            recording_id: recordingData.id,
            title: 'New Recording',
            status: 'processing',
            processing_progress: 0
          })
          .select()
          .single();

        if (noteError) {
          console.error('Error creating note:', noteError);
          throw new Error(`Failed to create note: ${noteError.message}`);
        }

        // Start transcription directly
        const { error: transcribeError } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { 
              noteId: note.id,
              recordingId: recordingData.id 
            }
          });

        if (transcribeError) {
          console.error('Transcription error:', transcribeError);
          toast({
            title: "Warning",
            description: "Recording saved but there was an error starting transcription. System will retry shortly.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Recording saved and transcription started!",
          });
        }
      }

      navigate("/app");
      
    } catch (error) {
      console.error('Error saving recording:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error saving recording",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { saveRecording, isProcessing };
};
