
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getMediaDuration } from "@/utils/mediaUtils";

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle navigation in useEffect
  useEffect(() => {
    if (shouldNavigate) {
      navigate("/app");
      setShouldNavigate(false);
    }
  }, [shouldNavigate, navigate]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo selecionado.",
        variant: "destructive",
      });
      return;
    }

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
      // Duration is already in milliseconds from getMediaDuration
      const durationInMs = await getMediaDuration(file);
      console.log('Media duration in milliseconds:', durationInMs);

      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Creating initial recording entry...');
      // Create initial recording entry with duration in milliseconds
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          title: file.name || `Recording ${new Date().toLocaleString()}`,
          file_path: 'pending',
          status: 'pending',
          duration: durationInMs  // This is already in milliseconds
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Erro ao criar registro: ${dbError.message}`);
      }
      console.log('Recording entry created:', recordingData);

      // Upload file and process
      const formData = new FormData();
      formData.append('file', file);
      formData.append('recordingId', recordingData.id);
      formData.append('duration', durationInMs.toString());  // Pass as string but keep in milliseconds

      console.log('Invoking transcribe-upload function...');
      const { data, error: functionError } = await supabase.functions.invoke('transcribe-upload', {
        body: formData,
      });

      if (functionError) {
        throw new Error(`Erro ao processar arquivo: ${functionError.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao processar arquivo');
      }

      toast({
        title: "Sucesso",
        description: "Arquivo processado com sucesso!",
      });

      // Set flag to navigate instead of directly calling navigate
      setShouldNavigate(true);

    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Show more specific error message to user
      toast({
        title: "Erro",
        description: error instanceof Error 
          ? `Erro ao processar arquivo: ${error.message}` 
          : "Erro ao processar o arquivo. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  return {
    isUploading,
    isProcessing,
    handleFileUpload
  };
};
