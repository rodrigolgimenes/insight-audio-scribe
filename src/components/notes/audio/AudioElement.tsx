
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
      console.error('[AudioElement] Audio error event:', e);
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

    const handleLoadStart = () => {
      console.log('[AudioElement] Load started:', { src });
    };

    const handleCanPlay = () => {
      const audioEl = ref as React.MutableRefObject<HTMLAudioElement>;
      console.log('[AudioElement] Can play event triggered:', {
        duration: audioEl.current?.duration,
        readyState: audioEl.current?.readyState,
        src: audioEl.current?.src
      });
    };

    const handleLoadedMetadata = () => {
      const audioEl = ref as React.MutableRefObject<HTMLAudioElement>;
      console.log('[AudioElement] Metadata loaded:', {
        duration: audioEl.current?.duration,
        readyState: audioEl.current?.readyState,
        src: audioEl.current?.src
      });
    };

    const handleProgress = () => {
      const audioEl = ref as React.MutableRefObject<HTMLAudioElement>;
      console.log('[AudioElement] Progress event:', {
        buffered: audioEl.current?.buffered.length > 0 
          ? `${audioEl.current?.buffered.start(0)} - ${audioEl.current?.buffered.end(0)}`
          : 'No buffered data',
        readyState: audioEl.current?.readyState
      });
    };

    return (
      <audio
        ref={ref}
        src={src}
        onEnded={onEnded}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onLoadedMetadata={handleLoadedMetadata}
        onProgress={handleProgress}
        preload="metadata"
      />
    );
  }
);

AudioElement.displayName = "AudioElement";
