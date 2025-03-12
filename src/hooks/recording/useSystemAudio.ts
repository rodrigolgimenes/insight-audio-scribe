
import { useToast } from "@/hooks/use-toast";
import { 
  SYSTEM_AUDIO_CONSTRAINTS, 
  MINIMAL_VIDEO_CONSTRAINTS,
  AUDIO_CONTEXT_OPTIONS,
  GAIN_VALUES
} from "./audioConfig";

export const useSystemAudio = () => {
  const { toast } = useToast();

  const captureSystemAudio = async (micStream: MediaStream): Promise<MediaStream | null> => {
    if (!navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Your browser does not support system audio capture');
    }

    let systemStream: MediaStream;
    
    try {
      console.log('[useSystemAudio] Attempting to capture system audio with full config');
      // Request with audio: true to ensure browser prompts for system audio
      systemStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
      });

      // Check if we got audio tracks
      if (!systemStream.getAudioTracks().length) {
        console.warn('[useSystemAudio] No audio tracks in display media, the user may not have selected system audio');
      } else {
        console.log('[useSystemAudio] Successfully captured system audio');
      }

    } catch (error) {
      console.error('[useSystemAudio] Failed to capture system audio:', error);
      throw error;
    }

    // Always mix whatever we got with the mic stream
    try {
      const mixedStream = await mixAudioStreams(micStream, systemStream);
      return mixedStream;
    } catch (mixError) {
      console.error('[useSystemAudio] Error mixing streams:', mixError);
      throw mixError;
    }
  };

  return { captureSystemAudio };
};

const mixAudioStreams = async (micStream: MediaStream, systemStream: MediaStream): Promise<MediaStream> => {
  const audioContext = new AudioContext(AUDIO_CONTEXT_OPTIONS);

  // Ensure the context is running
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }

  const micSource = audioContext.createMediaStreamSource(micStream);
  
  // Create destination for the final mixed stream
  const destination = audioContext.createMediaStreamDestination();
  
  // If we have audio tracks in the system stream, mix them
  if (systemStream.getAudioTracks().length > 0) {
    const systemSource = audioContext.createMediaStreamSource(systemStream);
    
    const micGain = audioContext.createGain();
    const systemGain = audioContext.createGain();
    
    // Set gain values
    micGain.gain.value = GAIN_VALUES.microphone;
    systemGain.gain.value = GAIN_VALUES.system;
    
    // Connect sources to gains
    micSource.connect(micGain);
    systemSource.connect(systemGain);
    
    // Connect gains to destination
    micGain.connect(destination);
    systemGain.connect(destination);
    
    // Handle system stream ended event
    systemStream.getAudioTracks()[0].onended = () => {
      console.log('[useSystemAudio] System audio sharing stopped');
      systemGain.disconnect();
    };
  } else {
    // If no system audio, just use the mic
    micSource.connect(destination);
  }

  return destination.stream;
};
