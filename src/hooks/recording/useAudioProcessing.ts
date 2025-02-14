
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

      // Upload em chunks para arquivos grandes
      const maxChunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(blob.size / maxChunkSize);
      const uploadPromises = [];
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * maxChunkSize;
        const end = Math.min(start + maxChunkSize, blob.size);
        const chunk = blob.slice(start, end);
        
        const uploadPromise = supabase.storage
          .from('audio_recordings')
          .upload(
            i === 0 ? fileName : `${fileName}.part${i}`,
            chunk,
            {
              cacheControl: '3600',
              upsert: false,
              contentType: 'audio/webm'
            }
          );

        uploadPromises.push(uploadPromise);
      }

      // Wait for all chunks to upload
      const uploadResults = await Promise.all(uploadPromises);
      const uploadErrors = uploadResults.filter(result => result.error);

      if (uploadErrors.length > 0) {
        // Clean up any uploaded chunks
        await supabase.storage
          .from('audio_recordings')
          .remove([fileName]);

        // Delete the recording entry
        await supabase
          .from('recordings')
          .delete()
          .eq('id', recordingData.id);

        throw new Error(`Failed to upload audio chunks: ${uploadErrors[0].error.message}`);
      }

      console.log('[useAudioProcessing] All chunks uploaded successfully');

      // Show upload success toast
      toast({
        title: "Upload successful",
        description: "Audio file uploaded successfully. Starting processing...",
      });

      // Call the process-recording function
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
        description: "Recording saved and processing started! You'll be notified when it's ready.",
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
