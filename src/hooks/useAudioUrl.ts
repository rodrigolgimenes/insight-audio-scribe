
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAudioUrl = (audioUrl: string | null) => {
  const { toast } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (audioUrl) {
        try {
          console.log('Getting signed URL for:', audioUrl);
          
          const { data: { signedUrl }, error: signError } = await supabase
            .storage
            .from('audio_recordings')
            .createSignedUrl(audioUrl, 3600); // 1 hour in seconds

          if (signError || !signedUrl) {
            throw new Error('Failed to generate signed URL');
          }

          console.log('Generated signed URL');
          setSignedUrl(signedUrl);
          setIsAudioReady(true);
        } catch (error) {
          console.error('Error getting signed URL:', error);
          toast({
            title: "Error",
            description: "Failed to load audio file",
            variant: "destructive",
          });
        }
      }
    };

    getSignedUrl();
  }, [audioUrl, toast]);

  return { signedUrl, isAudioReady };
};
