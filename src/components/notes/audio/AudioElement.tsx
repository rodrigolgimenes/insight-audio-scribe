
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
    const [lastErrorTime, setLastErrorTime] = useState(0);
    const errorCooldown = 5000; // 5 seconds between error messages
    
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
      
      // Rate limit error toasts to avoid spam
      const now = Date.now();
      if (now - lastErrorTime < errorCooldown) {
        console.log('[AudioElement] Skipping error toast due to cooldown');
        return;
      }
      
      setLastErrorTime(now);
      
      let errorMessage = "Error loading audio file";
      let suggestion = "Please try again.";
      
      if (target.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Audio playback was interrupted";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Network error while loading audio";
            suggestion = "Please check your internet connection and try again.";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Error decoding audio - format may not be supported";
            suggestion = "Try downloading the file instead.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio format not supported by your browser";
            suggestion = "Try using Chrome, Firefox, or Safari.";
            break;
        }
      }

      toast({
        title: "Audio Error",
        description: `${errorMessage}. ${suggestion}`,
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
        preload="metadata"
        controls={false}
      >
        <source src={src} type={audioType} />
        {/* Add alternative sources if possible */}
        {audioType === 'audio/webm' && <source src={src} type="audio/mp3" />}
        {audioType === 'audio/mpeg' && <source src={src} type="audio/webm" />}
        <p>Your browser does not support the audio element.</p>
      </audio>
    );
  }
);

AudioElement.displayName = "AudioElement";
