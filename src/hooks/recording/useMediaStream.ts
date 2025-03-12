
import { useCallback } from "react";
import { useAudioCapture } from "./useAudioCapture";

/**
 * Hook for managing media stream access
 */
export const useMediaStream = (
  setLastAction: (action: {action: string, timestamp: number, success: boolean, error?: string} | null) => void
) => {
  const { requestMicrophoneAccess } = useAudioCapture();

  // Wrapper function to request access with action tracking
  const requestMicAccess = useCallback(async (deviceId: string | null, isSystemAudio: boolean) => {
    try {
      setLastAction({
        action: `Request microphone access${isSystemAudio ? ' with system audio' : ''}`,
        timestamp: Date.now(),
        success: false
      });
      
      const stream = await requestMicrophoneAccess(deviceId, isSystemAudio);
      
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
  }, [requestMicrophoneAccess, setLastAction]);

  return {
    streamManager: {
      requestMicrophoneAccess: requestMicAccess
    }
  };
};
