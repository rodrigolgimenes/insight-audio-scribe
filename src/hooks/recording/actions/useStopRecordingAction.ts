
import { useCallback } from "react";

/**
 * Hook for handling the stop recording action
 */
export const useStopRecordingAction = (
  isRecording: boolean,
  stopRecording: () => Promise<{ blob: Blob | null; duration: number } | undefined>,
  setIsRecording: (value: boolean) => void,
  setIsPaused: (value: boolean) => void,
  setLastAction: (action: { action: string; timestamp: number; success: boolean; error?: string } | null) => void
) => {
  const handleStopRecording = useCallback(async () => {
    if (!isRecording) {
      console.log('[useStopRecordingAction] Not recording, nothing to stop');
      return;
    }

    console.log('[useStopRecordingAction] Stopping recording');
    try {
      setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: false
      });
      
      const result = await stopRecording();
      
      setIsRecording(false);
      setIsPaused(false);
      
      setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useStopRecordingAction] Recording stopped successfully');
      return result;
    } catch (error) {
      console.error('[useStopRecordingAction] Error stopping recording:', error);
      
      setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Still need to update state even if there's an error
      setIsRecording(false);
      setIsPaused(false);
      
      throw error;
    }
  }, [isRecording, stopRecording, setIsRecording, setIsPaused, setLastAction]);

  return handleStopRecording;
};
