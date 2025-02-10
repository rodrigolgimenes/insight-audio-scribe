
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
        
        // Clean up the file path by removing any URL base or parameters
        let cleanPath = audioUrl
          .replace(/^.*[\\\/]/, '') // Remove everything before the last slash
          .split('?')[0]; // Remove URL parameters if any
        
        // If the path is from Supabase storage, extract just the file name
        if (cleanPath.includes('storage/v1/object/public/')) {
          cleanPath = cleanPath.split('storage/v1/object/public/audio_recordings/').pop() || cleanPath;
        }
        
        console.log('[useAudioUrl] Cleaned path:', cleanPath);

        if (!cleanPath) {
          throw new Error('Invalid audio URL format');
        }

        // First, check the current state of the bucket
        const { data: bucketFiles, error: bucketError } = await supabase
          .storage
          .from('audio_recordings')
          .list('');
        
        console.log('[useAudioUrl] Current bucket files:', bucketFiles);
        
        if (bucketError) {
          console.error('[useAudioUrl] Error listing bucket:', bucketError);
          throw new Error(`Failed to list bucket: ${bucketError.message}`);
        }

        // Check if the file exists in the bucket
        const { data: listData, error: listError } = await supabase
          .storage
          .from('audio_recordings')
          .list('', {
            limit: 100,
            search: cleanPath,
          });

        console.log('[useAudioUrl] List result for path:', cleanPath, { listData, listError });

        if (listError) {
          console.error('[useAudioUrl] Error listing files:', listError);
          throw new Error(`Failed to check file existence: ${listError.message}`);
        }

        const fileExists = listData?.some(file => file.name === cleanPath);
        console.log('[useAudioUrl] File exists in bucket?', fileExists);

        if (!fileExists) {
          console.error('[useAudioUrl] File not found in bucket');
          throw new Error('Audio file not found in storage');
        }

        // Generate and check public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('audio_recordings')
          .getPublicUrl(cleanPath);

        console.log('[useAudioUrl] Public URL check:', publicUrlData);

        // Test public URL accessibility
        try {
          const publicResponse = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
          console.log('[useAudioUrl] Public URL accessibility:', publicResponse.status);
        } catch (error) {
          console.warn('[useAudioUrl] Public URL not accessible:', error);
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
          urlLength: signedData?.signedUrl?.length 
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
            contentType: response.headers.get('content-type')
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
