
import { useCallback } from "react";

export function usePauseResumeRecording(
  recorder: React.RefObject<any>
) {
  // Pause recording
  const pauseRecording = useCallback(() => {
    console.log('[usePauseResumeRecording] Pausing recording');
    
    if (!recorder.current) {
      console.error('[usePauseResumeRecording] Recorder is not initialized');
      return;
    }
    
    if (!recorder.current.isCurrentlyRecording()) {
      console.warn('[usePauseResumeRecording] Not recording, cannot pause');
      return;
    }
    
    if (recorder.current.isPausedState()) {
      console.warn('[usePauseResumeRecording] Already paused');
      return;
    }
    
    recorder.current.pauseRecording();
    console.log('[usePauseResumeRecording] Recording paused');
  }, [recorder]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    console.log('[usePauseResumeRecording] Resuming recording');
    
    if (!recorder.current) {
      console.error('[usePauseResumeRecording] Recorder is not initialized');
      return;
    }
    
    if (!recorder.current.isCurrentlyRecording()) {
      console.warn('[usePauseResumeRecording] Not recording, cannot resume');
      return;
    }
    
    if (!recorder.current.isPausedState()) {
      console.warn('[usePauseResumeRecording] Not paused, nothing to resume');
      return;
    }
    
    recorder.current.resumeRecording();
    console.log('[usePauseResumeRecording] Recording resumed');
  }, [recorder]);

  return {
    pauseRecording,
    resumeRecording
  };
}
