
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAudioProcessing = () => {
  const { toast } = useToast();

  const saveRecording = async (userId: string, blob: Blob, duration: number) => {
    try {
      // Criar entrada inicial da gravação
      const { data: recording, error: createError } = await supabase
        .from('recordings')
        .insert({
          user_id: userId,
          title: `Recording ${new Date().toLocaleString()}`,
          duration,
          status: 'pending',
          file_path: `${userId}/${Date.now()}.webm`
        })
        .select()
        .single();

      if (createError) throw createError;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(recording.file_path, blob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        });

      if (uploadError) {
        // Limpar gravação se o upload falhar
        await supabase
          .from('recordings')
          .delete()
          .eq('id', recording.id);
        throw uploadError;
      }

      // Iniciar processamento
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recording.id }
        });

      if (processError) {
        console.error('Error starting processing:', processError);
        toast({
          title: "Warning",
          description: "Recording saved but processing failed to start. It will retry automatically.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Recording saved! You can track the transcription progress in the dashboard.",
        });
      }

      return true;
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recording",
        variant: "destructive",
      });
      return false;
    }
  };

  return { saveRecording };
};
