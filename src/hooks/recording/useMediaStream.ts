
import { useCallback } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useSystemAudio } from "./useSystemAudio";
import { toast } from "sonner";

/**
 * Hook for managing media stream access
 */
export const useMediaStream = (
  setLastAction: (action: {action: string, timestamp: number, success: boolean, error?: string} | null) => void
) => {
  const { requestMicrophoneAccess } = useAudioCapture();
  const { captureSystemAudio } = useSystemAudio((enabled) => {
    console.log('System audio enabled:', enabled);
  });

  // Wrapper function to request access with action tracking
  const requestMicAccess = useCallback(async (deviceId: string | null, isSystemAudio: boolean) => {
    try {
      setLastAction({
        action: `Request microphone access${isSystemAudio ? ' with system audio' : ''}`,
        timestamp: Date.now(),
        success: false
      });
      
      let stream;
      if (isSystemAudio) {
        // First get the microphone stream
        const micStream = await requestMicrophoneAccess(deviceId, isSystemAudio);
        if (!micStream) {
          throw new Error('Failed to get microphone stream');
        }
        // Then use it to capture system audio
        stream = await captureSystemAudio(micStream, isSystemAudio);
      } else {
        stream = await requestMicrophoneAccess(deviceId, isSystemAudio);
      }
      
      if (stream) {
        setLastAction({
          action: `Request microphone access${isSystemAudio ? ' with system audio' : ''}`,
          timestamp: Date.now(),
          success: true
        });
      } else {
        throw new Error('Failed to get microphone stream');
      }
      
      return stream;
    } catch (error) {
      console.error('[useMediaStream] Error requesting microphone access:', error);
      setLastAction({
        action: `Request microphone access${isSystemAudio ? ' with system audio' : ''}`,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }, [requestMicrophoneAccess, setLastAction, captureSystemAudio]);

  // Function to request screen capture with audio
  const requestScreenAccess = useCallback(async (includeAudio: boolean) => {
    try {
      setLastAction({
        action: `Request screen capture${includeAudio ? ' with audio' : ''}`,
        timestamp: Date.now(),
        success: false
      });
      
      // Request screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          frameRate: { ideal: 30, max: 30 },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        } 
      });
      
      let finalStream = displayStream;
      
      // If audio is enabled, get audio stream and combine
      if (includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Combine streams
          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
          ]);
          
        } catch (error) {
          console.error('[useMediaStream] Error accessing microphone:', error);
          toast({
            description: "Microphone access denied. Continuing with screen capture only."
          });
        }
      }
      
      if (finalStream) {
        setLastAction({
          action: `Request screen capture${includeAudio ? ' with audio' : ''}`,
          timestamp: Date.now(),
          success: true
        });
      }
      
      return finalStream;
    } catch (error) {
      console.error('[useMediaStream] Error requesting screen capture:', error);
      setLastAction({
        action: `Request screen capture${includeAudio ? ' with audio' : ''}`,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }, [setLastAction]);

  return {
    streamManager: {
      requestMicrophoneAccess: requestMicAccess,
      requestScreenAccess
    }
  };
};
