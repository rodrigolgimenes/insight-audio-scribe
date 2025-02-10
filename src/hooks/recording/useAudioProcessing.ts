
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
      
      // Converter duração para inteiro (milissegundos)
      const durationInMs = Math.round(duration * 1000);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('Upload successful but file path is missing');
      }

      const { error: dbError, data: recordingData } = await supabase.from('recordings')
        .insert({
          user_id: userId,
          title: `Recording ${new Date().toLocaleString()}`,
          duration: durationInMs,
          file_path: fileName,
        })
        .select()
        .single();

      if (dbError) {
        await supabase.storage
          .from('audio_recordings')
          .remove([fileName]);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      const { error: transcriptionError } = await supabase.functions
        .invoke('transcribe-audio', {
          body: { recordingId: recordingData.id },
        });

      if (transcriptionError) {
        throw new Error(`Transcription failed: ${transcriptionError.message}`);
      }

      toast({
        title: "Success",
        description: "Recording saved and transcribed successfully!",
      });

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
