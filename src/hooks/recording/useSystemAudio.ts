
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
    try {
      systemStream = await navigator.mediaDevices.getDisplayMedia(SYSTEM_AUDIO_CONSTRAINTS);
    } catch (firstError) {
      console.warn('[useSystemAudio] First system audio attempt failed:', firstError);
      
      try {
        console.log('[useSystemAudio] Trying with minimal video');
        systemStream = await navigator.mediaDevices.getDisplayMedia(MINIMAL_VIDEO_CONSTRAINTS);

        const videoTracks = systemStream.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = false;
          track.stop();
          systemStream.removeTrack(track);
        });
      } catch (secondError) {
        console.error('[useSystemAudio] Both system audio capture attempts failed:', secondError);
        throw new Error('Não foi possível capturar o áudio do sistema após múltiplas tentativas');
      }
    }

    const systemAudioTracks = systemStream.getAudioTracks();
    if (systemAudioTracks.length === 0) {
      throw new Error('Nenhuma trilha de áudio do sistema disponível');
    }

    return mixAudioStreams(micStream, systemStream, toast);
  };

  return { captureSystemAudio };
};

const mixAudioStreams = (micStream: MediaStream, systemStream: MediaStream, toast: any): MediaStream => {
  const audioContext = new AudioContext(AUDIO_CONTEXT_OPTIONS);

  const micSource = audioContext.createMediaStreamSource(micStream);
  const systemSource = audioContext.createMediaStreamSource(systemStream);
  
  const micGain = audioContext.createGain();
  const systemGain = audioContext.createGain();
  
  micGain.gain.value = GAIN_VALUES.microphone;
  systemGain.gain.value = GAIN_VALUES.system;
  
  micSource.connect(micGain);
  systemSource.connect(systemGain);
  
  const merger = audioContext.createChannelMerger(2);
  const compressor = audioContext.createDynamicsCompressor();
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
