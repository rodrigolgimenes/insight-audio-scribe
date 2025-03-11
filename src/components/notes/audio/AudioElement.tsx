
import { forwardRef, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AudioElementProps {
  src: string | undefined;
  onEnded: () => void;
}

export const AudioElement = forwardRef<HTMLAudioElement, AudioElementProps>(
  ({ src, onEnded }, ref) => {
    const { toast } = useToast();
    const [supportedFormats, setSupportedFormats] = useState<Record<string, string>>({});
    
    useEffect(() => {
      // Check which audio formats are supported by the browser
      const audio = document.createElement('audio');
      const formats = {
        mp3: audio.canPlayType('audio/mpeg'),
        webm: audio.canPlayType('audio/webm'),
        wav: audio.canPlayType('audio/wav'),
        ogg: audio.canPlayType('audio/ogg')
      };
      
      console.log('[AudioElement] Browser supported formats:', formats);
      setSupportedFormats(formats);
    }, []);
    
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
      console.error('[AudioElement] Supported formats:', supportedFormats);
      
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
      if (url.includes('.wav')) return 'audio/wav';
      if (url.includes('.ogg')) return 'audio/ogg';
      // Default to webm if no extension found
      return 'audio/webm';
    };

    const handleLoadStart = () => {
      if (!src) return;
      
      const audioType = getAudioType(src);
      const audioElement = ref as React.MutableRefObject<HTMLAudioElement>;
      
      console.log('[AudioElement] Load started:', { 
        src,
        audioType,
        canPlayType: audioElement.current?.canPlayType(audioType),
        supportedFormats
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

    if (!src) {
      return null;
    }

    const audioType = getAudioType(src);

    // Try to provide multiple formats for better compatibility
    return (
      <audio
        ref={ref}
        onEnded={onEnded}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
        controls={false}
      >
        <source src={src} type={audioType} />
        {/* Add alternative sources if we can determine the original file type */}
        {audioType === 'audio/webm' && <source src={src} type="audio/mp3" />}
        {audioType === 'audio/mpeg' && <source src={src} type="audio/webm" />}
        <p>Seu navegador não suporta o elemento de áudio.</p>
      </audio>
    );
  }
);

AudioElement.displayName = "AudioElement";
