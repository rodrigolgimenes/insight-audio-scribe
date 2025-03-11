
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
        
        // Extract just the file path, removing the full URL if present
        let cleanPath = audioUrl;
        
        // If it's a complete Supabase Storage URL
        if (cleanPath.includes('storage/v1/object/public/')) {
          const parts = cleanPath.split('audio_recordings/');
          if (parts.length > 1) {
            cleanPath = parts[1];
          } else {
            console.warn('[useAudioUrl] Could not extract path from URL:', cleanPath);
          }
        }
        
        // If it has URL parameters, remove them
        cleanPath = cleanPath.split('?')[0];
        
        console.log('[useAudioUrl] Cleaned path:', cleanPath);

        // Check if file exists in bucket using the cleaned path
        const { data: existsData, error: existsError } = await supabase
          .storage
          .from('audio_recordings')
          .createSignedUrl(cleanPath, 3600);

        if (existsError) {
          console.error('[useAudioUrl] Error checking file existence:', existsError);
          throw new Error(`Falha ao verificar existência do arquivo: ${existsError.message}`);
        }

        if (!existsData?.signedUrl) {
          console.error('[useAudioUrl] File not found in bucket');
          throw new Error('Arquivo de áudio não encontrado no armazenamento');
        }

        console.log('[useAudioUrl] Signed URL generated:', {
          urlLength: existsData.signedUrl.length,
          preview: existsData.signedUrl.substring(0, 100) + '...'
        });

        // Check if the signed URL is accessible
        try {
          const response = await fetch(existsData.signedUrl, { method: 'HEAD' });
          console.log('[useAudioUrl] URL accessibility check:', {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type')
          });
          
          if (!response.ok) {
            throw new Error(`URL não acessível: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('[useAudioUrl] Error checking URL accessibility:', fetchError);
          // Continue even with verification error
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

    // Update signed URL every 45 minutes to avoid expiration
    const refreshInterval = setInterval(getSignedUrl, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [audioUrl, toast]);

  return { signedUrl, isAudioReady, error };
};
