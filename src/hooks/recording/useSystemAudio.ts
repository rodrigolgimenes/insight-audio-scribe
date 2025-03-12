
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
      console.error('[useSystemAudio] getDisplayMedia not supported');
      toast({
        title: "Error",
        description: "Your browser doesn't support system audio capture.",
        variant: "destructive",
      });
      return null;
    }

    let systemStream: MediaStream | null = null;
    
    try {
      console.log('[useSystemAudio] Requesting system audio with prompt');
      // First attempt: full configuration
      systemStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('[useSystemAudio] Got display media stream:', {
        hasAudio: systemStream.getAudioTracks().length > 0,
        hasVideo: systemStream.getVideoTracks().length > 0
      });

      // Check if we have audio tracks
      if (systemStream.getAudioTracks().length === 0) {
        console.warn('[useSystemAudio] No audio tracks in first attempt');
        
        // Clean up the failed stream
        systemStream.getTracks().forEach(track => track.stop());
        
        // Try with audio-only configuration
        systemStream = await navigator.mediaDevices.getDisplayMedia(SYSTEM_AUDIO_CONSTRAINTS);
        
        if (systemStream.getAudioTracks().length === 0) {
          console.warn('[useSystemAudio] No audio tracks in second attempt');
          systemStream.getTracks().forEach(track => track.stop());
          
          // Final attempt with minimal configuration
          systemStream = await navigator.mediaDevices.getDisplayMedia(MINIMAL_VIDEO_CONSTRAINTS);
        }
      }
      
      // Final check for audio tracks
      if (systemStream.getAudioTracks().length === 0) {
        console.error('[useSystemAudio] No audio tracks available after all attempts');
        toast({
          title: "Error",
          description: "No system audio detected. Make sure to select 'Share audio' when sharing.",
          variant: "destructive",
        });
        
        // Clean up the failed stream
        systemStream.getTracks().forEach(track => track.stop());
        return null;
      }
      
      // Remove video tracks to save resources (if any)
      const videoTracks = systemStream.getVideoTracks();
      if (videoTracks.length > 0) {
        console.log('[useSystemAudio] Removing video tracks to save resources');
        videoTracks.forEach(track => {
          track.enabled = false;
          track.stop();
          systemStream?.removeTrack(track);
        });
      }
      
      // Now mix the streams
      try {
        const mixedStream = await mixAudioStreams(micStream, systemStream, toast);
        return mixedStream;
      } catch (mixError) {
        console.error('[useSystemAudio] Error mixing streams:', mixError);
        // Stop system stream on error
        systemStream.getTracks().forEach(track => track.stop());
        toast({
          title: "Error",
          description: "Failed to process audio streams.",
          variant: "destructive",
        });
        return null;
      }
      
    } catch (error) {
      console.error('[useSystemAudio] Error capturing system audio:', error);
      
      // Clean up any stream we might have created
      if (systemStream) {
        systemStream.getTracks().forEach(track => track.stop());
      }
      
      toast({
        title: "System Audio",
        description: "System audio capture was cancelled or failed. Using microphone only.",
        variant: "default",
      });
      
      return null;
    }
  };

  return { captureSystemAudio };
};

const mixAudioStreams = async (micStream: MediaStream, systemStream: MediaStream, toast: any): Promise<MediaStream> => {
  console.log('[mixAudioStreams] Starting audio mixing');
  const audioContext = new AudioContext(AUDIO_CONTEXT_OPTIONS);

  // Make sure context is running
  if (audioContext.state !== 'running') {
    console.log('[mixAudioStreams] Resuming audio context');
    await audioContext.resume();
  }

  // Create sources for both streams
  const micSource = audioContext.createMediaStreamSource(micStream);
  const systemSource = audioContext.createMediaStreamSource(systemStream);
  
  // Create gain nodes for level control
  const micGain = audioContext.createGain();
  const systemGain = audioContext.createGain();
  
  // Apply a smooth fade-in to avoid audio spikes
  micGain.gain.setValueAtTime(0, audioContext.currentTime);
  systemGain.gain.setValueAtTime(0, audioContext.currentTime);
  
  micGain.gain.linearRampToValueAtTime(GAIN_VALUES.microphone, audioContext.currentTime + 0.5);
  systemGain.gain.linearRampToValueAtTime(GAIN_VALUES.system, audioContext.currentTime + 0.5);
  
  // Connect sources to their respective gain nodes
  micSource.connect(micGain);
  systemSource.connect(systemGain);
  
  // Create merger and compressor
  const merger = audioContext.createChannelMerger(2);
  const compressor = audioContext.createDynamicsCompressor();
  
  // Configure compressor for better audio quality
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;
  
  const destination = audioContext.createMediaStreamDestination();

  // Connect everything together
  micGain.connect(merger, 0, 0);
  systemGain.connect(merger, 0, 1);
  merger.connect(compressor);
  compressor.connect(destination);

  // Handle system audio stream ending
  systemStream.getAudioTracks()[0].onended = () => {
    console.log('[mixAudioStreams] System audio sharing stopped');
    toast({
      title: "Notice",
      description: "System audio sharing was stopped.",
      variant: "default",
    });
    
    // Close audio context to release resources
    audioContext.close().catch(console.error);
  };

  console.log('[mixAudioStreams] Stream mixing complete');
  return destination.stream;
};
