
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getMediaDuration } from "@/utils/mediaUtils";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Formato de arquivo não suportado. Por favor, use arquivos de áudio (MP3, WAV, WebM) ou vídeo (MP4).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setIsProcessing(true);

      console.log('Getting media duration...');
      const duration = await getMediaDuration(file);
      console.log('Media duration:', duration);

      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Creating initial recording entry...');
      // Create initial recording entry
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          title: file.name || `Recording ${new Date().toLocaleString()}`,
          file_path: 'pending',
          status: 'pending',
          duration: duration
        })
        .select()
        .single();

      if (dbError) throw dbError;
      console.log('Recording entry created:', recordingData);

      // Upload file and process
      const formData = new FormData();
      formData.append('file', file);
      formData.append('recordingId', recordingData.id);
      formData.append('duration', duration.toString());

      console.log('Invoking transcribe-upload function...');
      const response = await supabase.functions.invoke('transcribe-upload', {
        body: formData,
      });

      if (response.error) {
        throw new Error(`Error processing file: ${response.error.message}`);
      }

      if (!response.data?.success) {
        throw new Error('Failed to process file');
      }

      toast({
        title: "Sucesso",
        description: "Arquivo processado com sucesso!",
      });

      navigate("/app");

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar o arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  return {
    isUploading,
    isProcessing,
    handleFileUpload
  };
};
