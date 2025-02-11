
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
      
      if (!src) {
        console.log('[AudioElement] Ignoring error for empty source');
        return;
      }

      console.error('[AudioElement] Audio error event:', e);
      console.error('[AudioElement] Audio error code:', target.error?.code);
      console.error('[AudioElement] Audio error message:', target.error?.message);
      console.error('[AudioElement] Audio src:', target.src);
      console.error('[AudioElement] Network state:', target.networkState);
      console.error('[AudioElement] Ready state:', target.readyState);
      
      let errorMessage = "Erro ao carregar arquivo de áudio";
      if (target.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Reprodução de áudio foi interrompida";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Erro de rede ao carregar áudio";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Erro ao decodificar áudio - formato não suportado";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Formato de áudio não suportado pelo navegador";
            break;
        }
      }

      toast({
        title: "Erro no áudio",
        description: `${errorMessage}. Por favor, tente novamente.`,
        variant: "destructive",
      });
    };

    const getAudioType = (url: string): string => {
      if (url.includes('.mp3')) return 'audio/mpeg';
      if (url.includes('.webm')) return 'audio/webm';
      // Default to webm if no extension found
      return 'audio/webm';
    };

    const handleLoadStart = () => {
      if (!src) return;
      
      const audioType = getAudioType(src);
      console.log('[AudioElement] Load started:', { 
        src,
        audioType,
        ref: ref as React.MutableRefObject<HTMLAudioElement>,
        mimeTypes: {
          webm: (ref as React.MutableRefObject<HTMLAudioElement>).current?.canPlayType('audio/webm'),
          mp3: (ref as React.MutableRefObject<HTMLAudioElement>).current?.canPlayType('audio/mpeg')
        }
      });
    };

    const handleCanPlay = () => {
      if (!src) return;
      
      const audioEl = ref as React.MutableRefObject<HTMLAudioElement>;
      if (audioEl.current) {
        console.log('[AudioElement] Can play event:', {
          duration: audioEl.current.duration,
          readyState: audioEl.current.readyState,
          networkState: audioEl.current.networkState,
          src: audioEl.current.src
        });
      }
    };

    const handleLoadedMetadata = () => {
      if (!src) return;
      
      const audioEl = ref as React.MutableRefObject<HTMLAudioElement>;
      if (audioEl.current) {
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
      if (!src) return;
      
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

    if (!src) {
      return null;
    }

    const audioType = getAudioType(src);

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
        <source src={src} type={audioType} />
        Your browser does not support the audio element.
      </audio>
    );
  }
);

AudioElement.displayName = "AudioElement";
