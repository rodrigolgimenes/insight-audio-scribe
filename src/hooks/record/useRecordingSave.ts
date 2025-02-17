
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
      console.log('[useRecordingSave] Starting save process...');
      
      if (isRecording) {
        console.log('[useRecordingSave] Stopping recording...');
        await handleStopRecording();
      }

      setIsProcessing(true);
      console.log('[useRecordingSave] Checking user authentication...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[useRecordingSave] No authenticated user found');
        throw new Error('User not authenticated');
      }
      
      // Sanitize filename to prevent issues
      const fileName = `${user.id}/${Date.now()}.webm`.replace(/[^\x00-\x7F]/g, '');
      
      console.log('[useRecordingSave] Creating recording with user ID:', user.id);

      if (mediaStream) {
        console.log('[useRecordingSave] Stopping media stream...');
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

      // Create initial recording entry
      console.log('[useRecordingSave] Creating recording entry in database...');
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
        console.error('[useRecordingSave] Database error:', dbError);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      console.log('[useRecordingSave] Recording entry created:', recordingData);

      if (audioUrl) {
        console.log('[useRecordingSave] Fetching audio data...');
        const response = await fetch(audioUrl);
        const blob = await response.blob();

        // Upload with retries
        let uploadAttempts = 0;
        const maxAttempts = 3;
        let uploadError = null;

        console.log('[useRecordingSave] Starting file upload...');
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
              console.log('[useRecordingSave] File uploaded successfully');
              break;
            }
            uploadError = error;
          } catch (error) {
            uploadError = error;
          }
          uploadAttempts++;
          if (uploadAttempts < maxAttempts) {
            console.log(`[useRecordingSave] Upload attempt ${uploadAttempts} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        }

        if (uploadError) {
          console.error('[useRecordingSave] Upload failed after all attempts:', uploadError);
          // Clean up the recording entry if upload fails
          await supabase
            .from('recordings')
            .delete()
            .eq('id', recordingData.id);
          throw new Error(`Failed to upload audio: ${uploadError.message}`);
        }

        // Update recording status after successful upload
        console.log('[useRecordingSave] Updating recording status...');
        const { error: updateError } = await supabase
          .from('recordings')
          .update({
            file_path: fileName,
            status: 'uploaded'
          })
          .eq('id', recordingData.id);

        if (updateError) {
          console.error('[useRecordingSave] Error updating recording status:', updateError);
          throw new Error(`Failed to update recording: ${updateError.message}`);
        }
      }

      // Initiate processing with retry logic
      console.log('[useRecordingSave] Starting transcription process...');
      let processAttempts = 0;
      const maxProcessAttempts = 3;
      let processError = null;

      while (processAttempts < maxProcessAttempts) {
        try {
          console.log(`[useRecordingSave] Transcription attempt ${processAttempts + 1}...`);
          const { error } = await supabase.functions
            .invoke('transcribe-audio', {
              body: { recordingId: recordingData.id },
            });

          if (!error) {
            processError = null;
            console.log('[useRecordingSave] Transcription started successfully');
            break;
          }
          processError = error;
          console.error('[useRecordingSave] Transcription attempt failed:', error);
        } catch (error) {
          processError = error;
          console.error('[useRecordingSave] Transcription attempt threw error:', error);
        }
        processAttempts++;
        if (processAttempts < maxProcessAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * processAttempts));
        }
      }

      if (processError) {
        console.error('[useRecordingSave] Processing error:', processError);
        toast({
          title: "Warning",
          description: "Recording saved but processing failed to start. It will retry automatically.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Recording saved and processing started!",
        });
      }

      // Navigate anyway since the recording is saved
      navigate("/app");
      
    } catch (error) {
      console.error('[useRecordingSave] Error saving recording:', error);
      setIsProcessing(false);
      
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
