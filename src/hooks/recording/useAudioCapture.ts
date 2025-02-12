
import { useToast } from "@/hooks/use-toast";

export const useAudioCapture = () => {
  const { toast } = useToast();

  const requestMicrophoneAccess = async (isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      let micStream: MediaStream | null = null;
      let systemStream: MediaStream | null = null;
      
      // Primeiro, verifica se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta captura de áudio');
      }

      // Captura o áudio do microfone
      console.log('[useAudioCapture] Requesting microphone access with constraints');
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      };

      micStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (isSystemAudio) {
        console.log('[useAudioCapture] Requesting system audio');
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Seu navegador não suporta captura de áudio do sistema');
        }

        // Captura o áudio do sistema
        systemStream = await navigator.mediaDevices.getDisplayMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false 
        });

        // Combina os streams usando Web Audio API
        const audioContext = new AudioContext();
        const micSource = audioContext.createMediaStreamSource(micStream);
        const systemSource = audioContext.createMediaStreamSource(systemStream);
        const merger = audioContext.createChannelMerger(2);
        const destination = audioContext.createMediaStreamDestination();

        micSource.connect(merger, 0, 0);
        systemSource.connect(merger, 0, 1);
        merger.connect(destination);

        // Usa o stream combinado
        micStream = destination.stream;

        // Monitora quando o compartilhamento de tela é interrompido
        systemStream.getAudioTracks()[0].onended = () => {
          console.log('[useAudioCapture] System audio sharing stopped');
          toast({
            title: "Aviso",
            description: "O compartilhamento de áudio do sistema foi interrompido.",
            variant: "default",
          });
        };
      }

      console.log('[useAudioCapture] Audio stream details:', {
        id: micStream.id,
        active: micStream.active,
        trackCount: micStream.getAudioTracks().length,
        tracks: micStream.getAudioTracks().map(track => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings()
        }))
      });

      return micStream;
    } catch (error) {
      console.error('[useAudioCapture] Error accessing audio:', error);
      
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Permissão para uso do microfone negada';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'Nenhum microfone encontrado';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'O microfone pode estar sendo usado por outro aplicativo';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro de Captura",
        description: isSystemAudio 
          ? `Não foi possível capturar o áudio do sistema: ${errorMessage}`
          : `Não foi possível acessar o microfone: ${errorMessage}`,
        variant: "destructive",
      });
      
      return null;
    }
  };

  return {
    requestMicrophoneAccess,
  };
};
