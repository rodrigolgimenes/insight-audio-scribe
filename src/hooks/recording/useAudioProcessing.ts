
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useAudioProcessing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const saveRecording = async (
    userId: string,
    blob: Blob,
    duration: number
  ): Promise<boolean> => {
    try {
      const fileName = `${userId}/${Date.now()}.webm`;
      
      // Convert duration to integer (milliseconds)
      const durationInMs = Math.round(duration * 1000);
      
      console.log('[useAudioProcessing] Uploading audio file:', {
        fileName,
        blobSize: blob.size,
        blobType: blob.type,
        duration: durationInMs
      });

      // First create the recording entry
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          user_id: userId,
          title: `Recording ${new Date().toLocaleString()}`,
          duration: durationInMs,
          file_path: fileName,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to create recording entry: ${dbError.message}`);
      }

      console.log('[useAudioProcessing] Recording entry created:', recordingData);

      // Then upload the file
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'audio/webm'
        });

      if (uploadError) {
        // Delete the recording entry if file upload fails
        await supabase
          .from('recordings')
          .delete()
          .eq('id', recordingData.id);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      console.log('[useAudioProcessing] Audio file uploaded successfully');

      // Create a FormData object with the necessary information
      const formData = new FormData();
      formData.append('recordingId', recordingData.id);
      formData.append('duration', durationInMs.toString());

      // Call the transcribe-upload function
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingData.id }
        });

      if (processError) {
        console.error('[useAudioProcessing] Processing error:', processError);
        // Update recording status to error
        await supabase
          .from('recordings')
          .update({ 
            status: 'error',
            error_message: processError.message 
          })
          .eq('id', recordingData.id);
        throw new Error(`Processing failed: ${processError.message}`);
      }

      toast({
        title: "Success",
        description: "Recording saved and processing started!",
      });

      navigate("/app");
      return true;
    } catch (error) {
      console.error('[useAudioProcessing] Error saving recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recording. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    saveRecording,
  };
};
