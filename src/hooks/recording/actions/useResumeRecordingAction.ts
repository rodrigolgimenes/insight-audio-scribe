
import { useCallback } from "react";

/**
 * Hook for handling the resume recording action
 */
export const useResumeRecordingAction = (
  isRecording: boolean,
  isPaused: boolean,
  resumeRecording: () => void,
  setIsPaused: (value: boolean) => void,
  setLastAction: (action: { action: string; timestamp: number; success: boolean; error?: string } | null) => void
) => {
  const handleResumeRecording = useCallback(() => {
    if (!isRecording || !isPaused) {
      console.log('[useResumeRecordingAction] Cannot resume: not recording or not paused');
      return;
    }

    console.log('[useResumeRecordingAction] Resuming recording');
    try {
      resumeRecording();
      setIsPaused(false);
      
      setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useResumeRecordingAction] Recording resumed successfully');
    } catch (error) {
      console.error('[useResumeRecordingAction] Error resuming recording:', error);
      
      setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [isRecording, isPaused, resumeRecording, setIsPaused, setLastAction]);

  return handleResumeRecording;
};
