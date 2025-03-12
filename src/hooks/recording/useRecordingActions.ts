
import { useCallback } from "react";
import { RecordingStateType } from "./useRecordingState";

/**
 * Hook for recording action functions
 */
export const useRecordingActions = (
  recordingState: RecordingStateType,
  startRecording: (deviceId: string | null, isSystemAudio: boolean) => Promise<boolean>,
  stopRecording: () => Promise<{ blob: Blob | null; duration: number }>,
  pauseRecording: () => void,
  resumeRecording: () => void
) => {
  const {
    setIsRecording,
    setIsPaused,
    selectedDeviceId,
    isSystemAudio,
    setLastAction,
    isRecording,
    isPaused
  } = recordingState;

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    console.log('[useRecordingActions] Starting recording with device ID:', selectedDeviceId);
    console.log('[useRecordingActions] System audio enabled:', isSystemAudio);
    
    setLastAction({
      action: 'Start recording',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      const started = await startRecording(selectedDeviceId, isSystemAudio);
      
      if (started) {
        setIsRecording(true);
        setIsPaused(false);
        setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: true
        });
        return true;
      } else {
        setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: false,
          error: 'Failed to start recording'
        });
        return false;
      }
    } catch (error) {
      console.error('[useRecordingActions] Error starting recording:', error);
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }, [selectedDeviceId, isSystemAudio, startRecording, setIsRecording, setIsPaused, setLastAction]);

  // Handle stop recording
  const handleStopRecording = useCallback(async () => {
    console.log('[useRecordingActions] Stopping recording');
    
    setLastAction({
      action: 'Stop recording',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      const result = await stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      
      setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useRecordingActions] Recording stopped successfully');
      return result;
    } catch (error) {
      console.error('[useRecordingActions] Error stopping recording:', error);
      setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [stopRecording, setIsRecording, setIsPaused, setLastAction]);

  // Handle pause recording
  const handlePauseRecording = useCallback(() => {
    console.log('[useRecordingActions] Pausing recording');
    
    if (!isRecording) {
      console.warn('[useRecordingActions] Cannot pause: not recording');
      return;
    }
    
    if (isPaused) {
      console.warn('[useRecordingActions] Already paused');
      return;
    }
    
    try {
      pauseRecording();
      setIsPaused(true);
    } catch (error) {
      console.error('[useRecordingActions] Error pausing recording:', error);
    }
  }, [isRecording, isPaused, pauseRecording, setIsPaused]);

  // Handle resume recording
  const handleResumeRecording = useCallback(() => {
    console.log('[useRecordingActions] Resuming recording');
    
    if (!isRecording) {
      console.warn('[useRecordingActions] Cannot resume: not recording');
      return;
    }
    
    if (!isPaused) {
      console.warn('[useRecordingActions] Not paused, cannot resume');
      return;
    }
    
    try {
      resumeRecording();
      setIsPaused(false);
    } catch (error) {
      console.error('[useRecordingActions] Error resuming recording:', error);
    }
  }, [isRecording, isPaused, resumeRecording, setIsPaused]);

  return {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  };
};
