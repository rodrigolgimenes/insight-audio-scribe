
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
      if (audioUrl) {
        try {
          console.log('Getting signed URL for:', audioUrl);
          
          const { data: { signedUrl }, error: signError } = await supabase
            .storage
            .from('audio_recordings')
            .createSignedUrl(audioUrl, 3600); // 1 hour in seconds

          if (signError) {
            console.error('Error signing URL:', signError);
            throw new Error('Failed to generate signed URL');
          }

          if (!signedUrl) {
            throw new Error('No signed URL generated');
          }

          console.log('Generated signed URL successfully');
          setSignedUrl(signedUrl);
          setIsAudioReady(true);
          setError(null);
        } catch (error) {
          console.error('Error getting signed URL:', error);
          setError(error as Error);
          setIsAudioReady(false);
          toast({
            title: "Error",
            description: "Failed to load audio file. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setSignedUrl(null);
        setIsAudioReady(false);
      }
    };

    getSignedUrl();

    // Refresh the signed URL every 45 minutes to prevent expiration
    const refreshInterval = setInterval(getSignedUrl, 45 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [audioUrl, toast]);

  return { signedUrl, isAudioReady, error };
};
