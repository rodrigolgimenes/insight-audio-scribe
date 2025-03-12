
import { useCallback } from "react";

export const useSystemAudio = (setIsSystemAudio: (value: boolean) => void) => {
  const handleSystemAudioChange = useCallback((enabled: boolean) => {
    console.log('[useSystemAudio] Setting system audio to:', enabled);
    setIsSystemAudio(enabled);
  }, [setIsSystemAudio]);

  // This is a placeholder for the captureSystemAudio method
  // This method will be used to capture system audio from the display media
  const captureSystemAudio = useCallback(async (micStream: MediaStream): Promise<MediaStream | null> => {
    console.log('[useSystemAudio] Attempting to capture system audio');
    try {
      // Request system audio stream (via user selection)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: false
      });
      
      // Create a new stream that includes both sources
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      
      // Connect system audio
      const systemSource = ctx.createMediaStreamSource(displayStream);
      systemSource.connect(dest);
      
      // Connect microphone
      const micSource = ctx.createMediaStreamSource(micStream);
      micSource.connect(dest);
      
      // Use the combined stream
      console.log('[useSystemAudio] Successfully combined system and microphone audio');
      return dest.stream;
    } catch (error) {
      console.error('[useSystemAudio] Failed to capture system audio:', error);
      return null;
    }
  }, []);

  return {
    handleSystemAudioChange,
    captureSystemAudio
  };
};
