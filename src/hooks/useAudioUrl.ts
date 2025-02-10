
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAudioUrl = (audioUrl: string | null) => {
  const { toast } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!audioUrl) {
        console.log('[useAudioUrl] No audioUrl provided');
        setSignedUrl(null);
        setIsAudioReady(false);
        return;
      }

      try {
        console.log('[useAudioUrl] Starting to get signed URL for:', audioUrl);
        
        // Limpar o caminho do arquivo removendo qualquer URL base ou parâmetros
        const cleanPath = audioUrl
          .replace(/^.*[\\\/]/, '') // Remove tudo antes da última barra
          .split('?')[0]; // Remove parâmetros de URL se houver
        
        console.log('[useAudioUrl] Cleaned path:', cleanPath);

        if (!cleanPath) {
          throw new Error('Invalid audio URL format');
        }

        // Verificar se o arquivo existe no bucket
        const { data: listData, error: listError } = await supabase
          .storage
          .from('audio_recordings')
          .list('', {
            limit: 1,
            search: cleanPath,
          });

        console.log('[useAudioUrl] List result:', { listData, listError });

        if (listError) {
          console.error('[useAudioUrl] Error listing files:', listError);
          throw new Error(`Failed to check file existence: ${listError.message}`);
        }

        if (!listData || listData.length === 0) {
          console.error('[useAudioUrl] File not found in bucket');
          throw new Error('Audio file not found in storage');
        }

        // Gerar URL assinada
        console.log('[useAudioUrl] Generating signed URL for path:', cleanPath);
        
        const { data: signedData, error: signError } = await supabase
          .storage
          .from('audio_recordings')
          .createSignedUrl(cleanPath, 3600);

        console.log('[useAudioUrl] Signed URL result:', { signedData, signError });

        if (signError) {
          console.error('[useAudioUrl] Error signing URL:', signError);
          throw new Error(`Failed to generate signed URL: ${signError.message}`);
        }

        if (!signedData?.signedUrl) {
          console.error('[useAudioUrl] No signed URL generated');
          throw new Error('No signed URL generated');
        }

        console.log('[useAudioUrl] Successfully generated signed URL');
        setSignedUrl(signedData.signedUrl);
        setIsAudioReady(true);
        setError(null);
      } catch (error) {
        console.error('[useAudioUrl] Error in getSignedUrl:', error);
        setError(error as Error);
        setIsAudioReady(false);
        setSignedUrl(null);
        toast({
          title: "Erro ao Carregar Áudio",
          description: error instanceof Error ? error.message : "Falha ao carregar arquivo de áudio. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    };

    getSignedUrl();

    // Atualizar a URL assinada a cada 45 minutos para evitar expiração
    const refreshInterval = setInterval(getSignedUrl, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [audioUrl, toast]);

  return { signedUrl, isAudioReady, error };
};
