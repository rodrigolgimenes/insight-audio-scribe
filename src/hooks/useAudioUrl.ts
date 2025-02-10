
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
        
        // Extract the filename from the URL or path
        const filename = audioUrl.split('/').pop();
        
        if (!filename) {
          throw new Error('Invalid audio URL format');
        }

        console.log('[useAudioUrl] Using filename:', filename);

        // First check if file exists
        const { data: existsData, error: existsError } = await supabase
          .storage
          .from('audio_recordings')
          .list('', {
            search: filename
          });

        if (existsError || !existsData.length) {
          console.error('[useAudioUrl] File not found:', existsError || 'No matching file');
          throw new Error('Audio file not found');
        }

        // Generate signed URL
        const { data, error: signError } = await supabase
          .storage
          .from('audio_recordings')
          .createSignedUrl(filename, 3600);

        if (signError) {
          console.error('[useAudioUrl] Error signing URL:', signError);
          throw new Error(`Failed to generate signed URL: ${signError.message}`);
        }

        if (!data?.signedUrl) {
          console.error('[useAudioUrl] No signed URL generated');
          throw new Error('No signed URL generated');
        }

        console.log('[useAudioUrl] Generated signed URL successfully');
        setSignedUrl(data.signedUrl);
        setIsAudioReady(true);
        setError(null);
      } catch (error) {
        console.error('[useAudioUrl] Error in getSignedUrl:', error);
        setError(error as Error);
        setIsAudioReady(false);
        setSignedUrl(null);
        toast({
          title: "Error Loading Audio",
          description: error instanceof Error ? error.message : "Failed to load audio file. Please try again.",
          variant: "destructive",
        });
      }
    };

    getSignedUrl();

    // Refresh the signed URL every 45 minutes to prevent expiration
    const refreshInterval = setInterval(getSignedUrl, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [audioUrl, toast]);

  return { signedUrl, isAudioReady, error };
};
