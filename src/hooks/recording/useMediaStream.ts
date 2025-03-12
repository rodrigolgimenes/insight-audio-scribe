
import { useCallback } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useSystemAudio } from "./useSystemAudio";

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

  return {
    streamManager: {
      requestMicrophoneAccess: requestMicAccess
    }
  };
};
