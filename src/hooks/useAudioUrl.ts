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
        
        // Keep the full path structure for storage operations
        let cleanPath = audioUrl.split('?')[0]; // Remove URL parameters if any
        
        // If it's a full URL, extract just the path after audio_recordings/
        if (cleanPath.includes('storage/v1/object/public/')) {
          cleanPath = cleanPath.split('audio_recordings/')[1];
        }
        
        console.log('[useAudioUrl] Cleaned path:', cleanPath);
        console.log('[useAudioUrl] Original URL structure:', {
          fullUrl: audioUrl,
          cleanPath,
          includesStoragePrefix: audioUrl.includes('storage/v1/object/public/'),
          includesAudioRecordings: audioUrl.includes('audio_recordings')
        });

        if (!cleanPath) {
          throw new Error('Invalid audio URL format');
        }

        // First, check if the file exists in the bucket
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

        // Check if file exists by comparing the full path
        const fileExists = listData?.some(file => cleanPath.includes(file.name));
        console.log('[useAudioUrl] File exists check:', {
          fileExists,
          cleanPath,
          availableFiles: listData?.map(f => f.name)
        });

        if (!fileExists) {
          console.error('[useAudioUrl] File not found in bucket. Available files:', listData?.map(f => f.name));
          throw new Error('Audio file not found in storage');
        }

        // Generate signed URL
        console.log('[useAudioUrl] Generating signed URL for path:', cleanPath);
        
        const { data: signedData, error: signError } = await supabase
          .storage
          .from('audio_recordings')
          .createSignedUrl(cleanPath, 3600); // 1 hour validity

        console.log('[useAudioUrl] Signed URL result:', { 
          signedData, 
          signError,
          urlLength: signedData?.signedUrl?.length,
          generatedUrl: signedData?.signedUrl?.substring(0, 100) + '...' // Log first 100 chars for debugging
        });

        if (signError) {
          console.error('[useAudioUrl] Error signing URL:', signError);
          throw new Error(`Failed to generate signed URL: ${signError.message}`);
        }

        if (!signedData?.signedUrl) {
          console.error('[useAudioUrl] No signed URL generated');
          throw new Error('No signed URL generated');
        }

        // Check if signed URL is accessible
        try {
          const response = await fetch(signedData.signedUrl, { method: 'HEAD' });
          console.log('[useAudioUrl] Signed URL accessibility check:', {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            url: signedData.signedUrl.substring(0, 100) + '...' // Log first 100 chars for debugging
          });
          
          if (!response.ok) {
            throw new Error(`URL not accessible: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('[useAudioUrl] Error checking URL accessibility:', fetchError);
          // Don't throw the error here to allow the player to try using the URL anyway
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

    // Update signed URL every 45 minutes to avoid expiration
    const refreshInterval = setInterval(getSignedUrl, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [audioUrl, toast]);

  return { signedUrl, isAudioReady, error };
};
