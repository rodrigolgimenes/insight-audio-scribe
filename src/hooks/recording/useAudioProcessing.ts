
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
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        await supabase.storage
          .from('audio_recordings')
          .remove([fileName]);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      // Create a FormData object to send the file to the transcribe-upload function
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('recordingId', recordingData.id);
      formData.append('duration', durationInMs.toString());

      const { error: uploadFunctionError } = await supabase.functions
        .invoke('transcribe-upload', {
          body: formData,
        });

      if (uploadFunctionError) {
        throw new Error(`Upload processing failed: ${uploadFunctionError.message}`);
      }

      toast({
        title: "Sucesso",
        description: "Gravação salva com sucesso! A transcrição começará em breve.",
      });

      navigate("/app");
      return true;
    } catch (error) {
      console.error('[useAudioProcessing] Error saving recording:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar a gravação. Por favor, tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    saveRecording,
  };
};
