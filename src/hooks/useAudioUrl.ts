
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
        if (audioUrl.includes('storage/v1/object/public/')) {
          cleanPath = audioUrl.split('audio_recordings/')[1];
        }
        
        // Se tiver parâmetros de URL, removê-los
        cleanPath = cleanPath.split('?')[0];
        
        console.log('[useAudioUrl] Cleaned path:', cleanPath);

        // Primeiro, verificar se o arquivo existe no bucket
        const { data: listData, error: listError } = await supabase
          .storage
          .from('audio_recordings')
          .list('', {
            limit: 100,
            search: cleanPath,
          });

        console.log('[useAudioUrl] List result:', {
          listData,
          listError,
          searchPath: cleanPath,
          foundFiles: listData?.length,
          matchingFile: listData?.find(file => file.name === cleanPath)
        });

        if (listError) {
          console.error('[useAudioUrl] Error listing files:', listError);
          throw new Error(`Failed to check file existence: ${listError.message}`);
        }

        // Verificar se o arquivo existe comparando o caminho completo
        const fileExists = listData?.some(file => {
          const filePath = cleanPath.includes('/') ? cleanPath : `${file.name}`;
          return cleanPath.includes(filePath);
        });

        console.log('[useAudioUrl] File exists check:', {
          fileExists,
          cleanPath,
          availableFiles: listData?.map(f => f.name)
        });

        if (!fileExists) {
          console.error('[useAudioUrl] File not found in bucket. Available files:', listData?.map(f => f.name));
          throw new Error('Audio file not found in storage');
        }

        // Gerar URL assinada
        console.log('[useAudioUrl] Generating signed URL for path:', cleanPath);
        
        const { data: signedData, error: signError } = await supabase
          .storage
          .from('audio_recordings')
          .createSignedUrl(cleanPath, 3600); // 1 hora de validade

        console.log('[useAudioUrl] Signed URL result:', { 
          signedData, 
          signError,
          urlLength: signedData?.signedUrl?.length,
          generatedUrl: signedData?.signedUrl?.substring(0, 100) + '...' // Log primeiros 100 caracteres para debug
        });

        if (signError) {
          console.error('[useAudioUrl] Error signing URL:', signError);
          throw new Error(`Failed to generate signed URL: ${signError.message}`);
        }

        if (!signedData?.signedUrl) {
          console.error('[useAudioUrl] No signed URL generated');
          throw new Error('No signed URL generated');
        }

        // Verificar se a URL assinada é acessível
        try {
          const response = await fetch(signedData.signedUrl, { method: 'HEAD' });
          console.log('[useAudioUrl] Signed URL accessibility check:', {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            url: signedData.signedUrl.substring(0, 100) + '...'
          });
          
          if (!response.ok) {
            throw new Error(`URL not accessible: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('[useAudioUrl] Error checking URL accessibility:', fetchError);
          // Não lançar o erro aqui para permitir que o player tente usar a URL mesmo assim
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

    // Atualizar URL assinada a cada 45 minutos para evitar expiração
    const refreshInterval = setInterval(getSignedUrl, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [audioUrl, toast]);

  return { signedUrl, isAudioReady, error };
};
