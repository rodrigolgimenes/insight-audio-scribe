
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useRecordingSave = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const fileName = `${user.id}/${Date.now()}.webm`;
      
      console.log('Creating recording with user ID:', user.id);

      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }

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

      console.log('Recording saved:', recordingData);

      if (audioUrl) {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('audio_recordings')
          .upload(fileName, blob, {
            contentType: 'audio/webm',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload audio: ${uploadError.message}`);
        }

        const { error: updateError } = await supabase
          .from('recordings')
          .update({
            file_path: fileName,
            status: 'uploaded'
          })
          .eq('id', recordingData.id);

        if (updateError) {
          throw new Error(`Failed to update recording: ${updateError.message}`);
        }
      }

      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingData.id },
        });

      if (processError) {
        console.error('Processing error:', processError);
        throw new Error(`Processing failed: ${processError.message}`);
      }

      console.log('Processing initiated');

      toast({
        title: "Sucesso",
        description: "Gravação salva e processamento iniciado!",
      });
      
      navigate("/app");
      
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar gravação",
        variant: "destructive",
      });
    }
  };

  return { saveRecording };
};
