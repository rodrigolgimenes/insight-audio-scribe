
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

      // Lista os dispositivos de áudio disponíveis
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      console.log('[useAudioCapture] Available audio devices:', audioInputs);

      if (audioInputs.length === 0) {
        throw new Error('Nenhum dispositivo de áudio encontrado');
      }

      // Tenta capturar o áudio do microfone com configurações avançadas
      console.log('[useAudioCapture] Requesting microphone access with advanced constraints');
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 2 },
          sampleRate: { ideal: 48000 },
          sampleSize: { ideal: 16 }
        },
        video: false
      };

      try {
        micStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (micError) {
        console.warn('[useAudioCapture] Failed with advanced constraints, trying basic config:', micError);
        // Se falhar, tenta com configurações básicas
        micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: false 
        });
      }

      if (isSystemAudio) {
        console.log('[useAudioCapture] Requesting system audio');
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Seu navegador não suporta captura de áudio do sistema');
        }

        try {
          // Primeira tentativa: apenas áudio
          systemStream = await navigator.mediaDevices.getDisplayMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false 
          });
        } catch (firstError) {
          console.warn('[useAudioCapture] First system audio attempt failed:', firstError);
          
          try {
            // Segunda tentativa: áudio com vídeo mínimo
            console.log('[useAudioCapture] Trying with minimal video');
            systemStream = await navigator.mediaDevices.getDisplayMedia({ 
              audio: true,
              video: { 
                width: 1,
                height: 1,
                frameRate: 1
              }
            });

            // Remove a trilha de vídeo imediatamente
            const videoTracks = systemStream.getVideoTracks();
            videoTracks.forEach(track => {
              track.enabled = false;
              track.stop();
              systemStream?.removeTrack(track);
            });
          } catch (secondError) {
            console.error('[useAudioCapture] Both system audio capture attempts failed:', secondError);
            throw new Error('Não foi possível capturar o áudio do sistema após múltiplas tentativas');
          }
        }

        // Verifica se temos trilhas de áudio válidas
        const systemAudioTracks = systemStream.getAudioTracks();
        if (systemAudioTracks.length === 0) {
          throw new Error('Nenhuma trilha de áudio do sistema disponível');
        }

        console.log('[useAudioCapture] System audio tracks:', systemAudioTracks);

        // Combina os streams usando Web Audio API com tratamento de erro
        try {
          const audioContext = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: 48000
          });

          const micSource = audioContext.createMediaStreamSource(micStream);
          const systemSource = audioContext.createMediaStreamSource(systemStream);
          
          // Usa um ganho para controlar os níveis
          const micGain = audioContext.createGain();
          const systemGain = audioContext.createGain();
          
          micGain.gain.value = 0.7; // Ajusta o volume do microfone
          systemGain.gain.value = 0.5; // Ajusta o volume do sistema
          
          micSource.connect(micGain);
          systemSource.connect(systemGain);
          
          const merger = audioContext.createChannelMerger(2);
          const compressor = audioContext.createDynamicsCompressor();
          const destination = audioContext.createMediaStreamDestination();

          micGain.connect(merger, 0, 0);
          systemGain.connect(merger, 0, 1);
          merger.connect(compressor);
          compressor.connect(destination);

          // Usa o stream combinado
          micStream = destination.stream;

          // Monitora quando o compartilhamento de tela é interrompido
          systemStream.getAudioTracks()[0].onended = () => {
            console.log('[useAudioCapture] System audio sharing stopped');
            audioContext.close().catch(console.error);
            toast({
              title: "Aviso",
              description: "O compartilhamento de áudio do sistema foi interrompido.",
              variant: "default",
            });
          };
        } catch (mixError) {
          console.error('[useAudioCapture] Error mixing audio streams:', mixError);
          throw new Error('Erro ao combinar as fontes de áudio');
        }
      }

      // Log detalhado do stream final
      console.log('[useAudioCapture] Final audio stream details:', {
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
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Configuração de áudio não suportada. Tente desconectar e reconectar seu dispositivo USB';
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
