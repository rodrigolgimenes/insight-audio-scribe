
import { useCallback } from "react";

/**
 * Hook for handling the pause recording action
 */
export const usePauseRecordingAction = (
  isRecording: boolean,
  isPaused: boolean,
  pauseRecording: () => void,
  setIsPaused: (value: boolean) => void,
  setLastAction: (action: { action: string; timestamp: number; success: boolean; error?: string } | null) => void
) => {
  const handlePauseRecording = useCallback(() => {
    if (!isRecording || isPaused) {
      console.log('[usePauseRecordingAction] Cannot pause: not recording or already paused');
      return;
    }

    console.log('[usePauseRecordingAction] Pausing recording');
    try {
      pauseRecording();
      setIsPaused(true);
      
      setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[usePauseRecordingAction] Recording paused successfully');
    } catch (error) {
      console.error('[usePauseRecordingAction] Error pausing recording:', error);
      
      setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [isRecording, isPaused, pauseRecording, setIsPaused, setLastAction]);

  return handlePauseRecording;
};
