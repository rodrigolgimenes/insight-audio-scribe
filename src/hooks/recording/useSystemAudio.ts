
import { useToast } from "@/hooks/use-toast";
import { 
  SYSTEM_AUDIO_CONSTRAINTS, 
  MINIMAL_VIDEO_CONSTRAINTS,
  AUDIO_CONTEXT_OPTIONS,
  GAIN_VALUES
} from "./audioConfig";

export const useSystemAudio = () => {
  const { toast } = useToast();

  const captureSystemAudio = async (micStream: MediaStream): Promise<MediaStream> => {
    if (!navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Seu navegador não suporta captura de áudio do sistema');
    }

    let systemStream: MediaStream;
    
    // Primeira tentativa: configuração completa
    try {
      console.log('[useSystemAudio] Attempting to capture system audio with full config');
      systemStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (!systemStream.getAudioTracks().length) {
        throw new Error('No audio tracks available');
      }

    } catch (firstError) {
      console.warn('[useSystemAudio] First attempt failed:', firstError);
      
      // Segunda tentativa: apenas áudio
      try {
        console.log('[useSystemAudio] Attempting audio-only capture');
        systemStream = await navigator.mediaDevices.getDisplayMedia(SYSTEM_AUDIO_CONSTRAINTS);
        
        if (!systemStream.getAudioTracks().length) {
          throw new Error('No audio tracks available');
        }

      } catch (secondError) {
        console.warn('[useSystemAudio] Second attempt failed:', secondError);
        
        // Terceira tentativa: configuração mínima
        try {
          console.log('[useSystemAudio] Attempting with minimal config');
          systemStream = await navigator.mediaDevices.getDisplayMedia(MINIMAL_VIDEO_CONSTRAINTS);
          
          // Verifica se temos áudio antes de continuar
          if (!systemStream.getAudioTracks().length) {
            throw new Error('No audio tracks available');
          }

          // Remove trilhas de vídeo se existirem
          const videoTracks = systemStream.getVideoTracks();
          videoTracks.forEach(track => {
            track.enabled = false;
            track.stop();
            systemStream.removeTrack(track);
          });

        } catch (thirdError) {
          console.error('[useSystemAudio] All attempts failed:', { firstError, secondError, thirdError });
          throw new Error('Não foi possível capturar o áudio do sistema. Por favor, certifique-se de selecionar uma fonte de áudio ao compartilhar.');
        }
      }
    }

    // Verifica novamente se temos trilhas de áudio válidas
    const systemAudioTracks = systemStream.getAudioTracks();
    if (systemAudioTracks.length === 0) {
      throw new Error('Selecione uma fonte com áudio ao compartilhar a tela');
    }

    try {
      return await mixAudioStreams(micStream, systemStream, toast);
    } catch (mixError) {
      console.error('[useSystemAudio] Error mixing streams:', mixError);
      throw new Error('Erro ao processar o áudio. Por favor, tente novamente.');
    }
  };

  return { captureSystemAudio };
};

const mixAudioStreams = async (micStream: MediaStream, systemStream: MediaStream, toast: any): Promise<MediaStream> => {
  const audioContext = new AudioContext(AUDIO_CONTEXT_OPTIONS);

  // Aguarda o contexto de áudio estar pronto
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }

  const micSource = audioContext.createMediaStreamSource(micStream);
  const systemSource = audioContext.createMediaStreamSource(systemStream);
  
  const micGain = audioContext.createGain();
  const systemGain = audioContext.createGain();
  
  // Aplica um fade-in suave para evitar picos de áudio
  micGain.gain.setValueAtTime(0, audioContext.currentTime);
  systemGain.gain.setValueAtTime(0, audioContext.currentTime);
  
  micGain.gain.linearRampToValueAtTime(GAIN_VALUES.microphone, audioContext.currentTime + 0.5);
  systemGain.gain.linearRampToValueAtTime(GAIN_VALUES.system, audioContext.currentTime + 0.5);
  
  micSource.connect(micGain);
  systemSource.connect(systemGain);
  
  const merger = audioContext.createChannelMerger(2);
  const compressor = audioContext.createDynamicsCompressor();
  
  // Configura o compressor para melhor qualidade
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;
  
  const destination = audioContext.createMediaStreamDestination();

  micGain.connect(merger, 0, 0);
  systemGain.connect(merger, 0, 1);
  merger.connect(compressor);
  compressor.connect(destination);

  systemStream.getAudioTracks()[0].onended = () => {
    console.log('[useSystemAudio] System audio sharing stopped');
    audioContext.close().catch(console.error);
    toast({
      title: "Aviso",
      description: "O compartilhamento de áudio do sistema foi interrompido.",
      variant: "default",
    });
  };

  return destination.stream;
};
