
import { forwardRef } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AudioElementProps {
  src: string | undefined;
  onEnded: () => void;
}

export const AudioElement = forwardRef<HTMLAudioElement, AudioElementProps>(
  ({ src, onEnded }, ref) => {
    const { toast } = useToast();

    const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
      const target = e.currentTarget;
      console.error('[AudioElement] Audio error:', e);
      console.error('[AudioElement] Audio error code:', target.error?.code);
      console.error('[AudioElement] Audio error message:', target.error?.message);
      console.error('[AudioElement] Audio src:', target.src);
      
      let errorMessage = "Error loading audio file";
      if (target.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Audio playback was aborted";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error occurred while loading audio";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Audio decoding failed";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio format not supported";
            break;
        }
      }

      toast({
        title: "Error",
        description: `${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    };

    return (
      <audio
        ref={ref}
        src={src}
        onEnded={onEnded}
        onError={handleError}
        preload="auto"
        crossOrigin="anonymous"
      />
    );
  }
);

AudioElement.displayName = "AudioElement";
