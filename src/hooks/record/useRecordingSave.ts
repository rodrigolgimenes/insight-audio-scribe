
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
    if (isProcessing) {
      console.log('Already processing, preventing duplicate submission');
      return;
    }

    try {
      setIsProcessing(true);

      if (isRecording) {
        console.log('Stopping recording...');
        await handleStopRecording();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const fileName = `${user.id}/${Date.now()}.webm`.replace(/[^\x00-\x7F]/g, '');
      
      console.log('Creating recording with user ID:', user.id);

      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

      if (!audioUrl) {
        throw new Error('No audio data available');
      }

      const response = await fetch(audioUrl);
      const blob = await response.blob();

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

      // Create note entry using unique constraint
      console.log('Creating note for recording:', recordingData.id);
      const { data: existingNote } = await supabase
        .from('notes')
        .select()
        .eq('recording_id', recordingData.id)
        .single();

      if (!existingNote) {
        const { error: noteError } = await supabase
          .from('notes')
          .insert({
            recording_id: recordingData.id,
            user_id: user.id,
            title: recordingData.title,
            status: 'processing',
            processing_progress: 0
          });

        if (noteError) {
          console.error('Error creating note:', noteError);
          throw new Error(`Failed to create note: ${noteError.message}`);
        }
      }

      // Update recording status
      const { error: updateError } = await supabase
        .from('recordings')
        .update({ status: 'transcribing' })
        .eq('id', recordingData.id);

      if (updateError) {
        throw new Error(`Failed to update recording: ${updateError.message}`);
      }

      // Start transcription
      const { error: transcribeError } = await supabase.functions
        .invoke('transcribe-audio', {
          body: { 
            noteId: existingNote?.id,
            recordingId: recordingData.id 
          }
        });

      if (transcribeError) {
        console.error('Transcription error:', transcribeError);
        toast({
          title: "Warning",
          description: "Recording saved, but there was an error starting transcription. The system will try again soon.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Recording saved and transcription started!",
        });
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
