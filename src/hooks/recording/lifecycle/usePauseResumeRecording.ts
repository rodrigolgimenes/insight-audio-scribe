
import { useCallback } from "react";

export function usePauseResumeRecording(
  recorder: React.RefObject<any>,
  state: { 
    setIsPaused: (value: boolean) => void;
  }
) {
  const handlePauseRecording = useCallback(() => {
    console.log('[usePauseResumeRecording] Pausing recording');
    
    if (!recorder.current) {
      throw new Error('Recorder not initialized');
    }

    try {
      recorder.current.pauseRecording();
      state.setIsPaused(true);
      console.log('[usePauseResumeRecording] Recording paused successfully');
    } catch (error) {
      console.error('[usePauseResumeRecording] Error pausing recording:', error);
      throw error;
    }
  }, [recorder, state]);

  const handleResumeRecording = useCallback(() => {
    console.log('[usePauseResumeRecording] Resuming recording');
    
    if (!recorder.current) {
      throw new Error('Recorder not initialized');
    }

    try {
      recorder.current.resumeRecording();
      state.setIsPaused(false);
      console.log('[usePauseResumeRecording] Recording resumed successfully');
    } catch (error) {
      console.error('[usePauseResumeRecording] Error resuming recording:', error);
      throw error;
    }
  }, [recorder, state]);

  return {
    handlePauseRecording,
    handleResumeRecording
  };
}
