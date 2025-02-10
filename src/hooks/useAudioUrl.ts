
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
        
        const filename = audioUrl.includes('/') 
          ? audioUrl.split('/').pop() 
          : audioUrl;
        
        if (!filename) {
          throw new Error('Invalid audio URL format');
        }

        console.log('[useAudioUrl] Using filename:', filename);

        // First try to get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('audio_recordings')
          .getPublicUrl(filename);

        if (!publicUrlData.publicUrl) {
          throw new Error('Failed to generate public URL');
        }

        // Then generate signed URL for actual access
        const { data, error: signError } = await supabase
          .storage
          .from('audio_recordings')
          .createSignedUrl(filename, 3600);

        if (signError) {
          console.error('[useAudioUrl] Error signing URL:', signError);
          throw new Error(`Failed to generate signed URL: ${signError.message}`);
        }

        if (!data.signedUrl) {
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
