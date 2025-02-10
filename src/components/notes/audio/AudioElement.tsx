
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
      console.error('[AudioElement] Network state:', target.networkState);
      console.error('[AudioElement] Ready state:', target.readyState);
      console.error('[AudioElement] MIME type:', target.canPlayType('audio/webm'), target.canPlayType('audio/mp3'));
      
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
            errorMessage = "Audio decoding failed - formato não suportado";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio format not supported by browser";
            break;
        }
      }

      toast({
        title: "Erro no áudio",
        description: `${errorMessage}. Por favor, tente novamente.`,
        variant: "destructive",
      });
    };

    const handleLoadStart = () => {
      console.log('[AudioElement] Load started:', { 
        src,
        ref: ref as React.MutableRefObject<HTMLAudioElement>,
        mimeTypes: {
          webm: (ref as React.MutableRefObject<HTMLAudioElement>).current?.canPlayType('audio/webm'),
          mp3: (ref as React.MutableRefObject<HTMLAudioElement>).current?.canPlayType('audio/mp3')
        }
      });
    };

    const handleCanPlay = () => {
      const audioEl = ref as React.MutableRefObject<HTMLAudioElement>;
      if (audioEl.current) {
        if (!isFinite(audioEl.current.duration)) {
          audioEl.current.load();
        }
        console.log('[AudioElement] Can play event triggered:', {
          duration: isFinite(audioEl.current.duration) ? audioEl.current.duration : 'Loading...',
          readyState: audioEl.current.readyState,
          src: audioEl.current.src,
          networkState: audioEl.current.networkState,
          type: audioEl.current.canPlayType('audio/webm')
        });
      }
    };

    const handleLoadedMetadata = () => {
      const audioEl = ref as React.MutableRefObject<HTMLAudioElement>;
      if (audioEl.current) {
        if (!isFinite(audioEl.current.duration)) {
          console.warn('[AudioElement] Invalid duration detected, reloading metadata');
          audioEl.current.load();
          return;
        }
        console.log('[AudioElement] Metadata loaded:', {
          duration: audioEl.current.duration,
          readyState: audioEl.current.readyState,
          src: audioEl.current.src,
          networkState: audioEl.current.networkState,
          mimeType: audioEl.current.currentSrc.split('.').pop()
        });
      }
    };

    const handleProgress = () => {
      const audioEl = ref as React.MutableRefObject<HTMLAudioElement>;
      if (audioEl.current) {
        console.log('[AudioElement] Progress event:', {
          buffered: audioEl.current.buffered.length > 0 
            ? `${audioEl.current.buffered.start(0)} - ${audioEl.current.buffered.end(0)}`
            : 'No buffered data',
          readyState: audioEl.current.readyState,
          networkState: audioEl.current.networkState,
          duration: isFinite(audioEl.current.duration) ? audioEl.current.duration : 'Loading...'
        });
      }
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
      >
        <source src={src} type="audio/webm" />
        <source src={src} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    );
  }
);

AudioElement.displayName = "AudioElement";

