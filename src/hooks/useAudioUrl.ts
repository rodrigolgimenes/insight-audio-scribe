
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
        console.log('[useAudioUrl] Input audioUrl:', audioUrl);
        
        // Extrair apenas o caminho do arquivo, removendo a URL completa se presente
        let cleanPath = audioUrl;
        
        // Se for uma URL completa do Supabase Storage
        if (cleanPath.includes('storage/v1/object/public/')) {
          cleanPath = cleanPath.split('audio_recordings/')[1];
        }
        
        // Se tiver parâmetros de URL, removê-los
        cleanPath = cleanPath.split('?')[0];
        
        console.log('[useAudioUrl] Cleaned path:', cleanPath);

        // Verificar se o arquivo existe no bucket usando o caminho completo
        const { data: existsData, error: existsError } = await supabase
          .storage
          .from('audio_recordings')
          .createSignedUrl(cleanPath, 3600);

        if (existsError) {
          console.error('[useAudioUrl] Error checking file existence:', existsError);
          throw new Error(`Failed to check file existence: ${existsError.message}`);
        }

        if (!existsData?.signedUrl) {
          console.error('[useAudioUrl] File not found in bucket');
          throw new Error('Audio file not found in storage');
        }

        console.log('[useAudioUrl] Signed URL generated:', {
          urlLength: existsData.signedUrl.length,
          preview: existsData.signedUrl.substring(0, 100) + '...'
        });

        // Verificar se a URL assinada é acessível
        try {
          const response = await fetch(existsData.signedUrl, { method: 'HEAD' });
          console.log('[useAudioUrl] URL accessibility check:', {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type')
          });
          
          if (!response.ok) {
            throw new Error(`URL not accessible: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('[useAudioUrl] Error checking URL accessibility:', fetchError);
          // Continuar mesmo com erro de verificação
        }

        setSignedUrl(existsData.signedUrl);
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

    // Atualizar URL assinada a cada 45 minutos para evitar expiração
    const refreshInterval = setInterval(getSignedUrl, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [audioUrl, toast]);

  return { signedUrl, isAudioReady, error };
};
