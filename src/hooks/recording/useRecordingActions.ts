
import { useCallback } from "react";
import { RecordingStateType } from "./useRecordingState";

type RecordingLifecycle = {
  startRecording: (deviceId: string | null, isSystemAudio: boolean) => Promise<boolean>;
  stopRecording: () => Promise<{ blob: Blob | null; duration: number } | undefined>;
  pauseRecording: () => void;
  resumeRecording: () => void;
};

/**
 * Hook for providing high-level recording action handlers
 */
export const useRecordingActions = (
  recordingState: RecordingStateType,
  startRecording: RecordingLifecycle["startRecording"],
  stopRecording: RecordingLifecycle["stopRecording"],
  pauseRecording: RecordingLifecycle["pauseRecording"],
  resumeRecording: RecordingLifecycle["resumeRecording"]
) => {
  const {
    isRecording,
    isPaused,
    setIsRecording,
    setIsPaused,
    isSystemAudio,
    selectedDeviceId,
    setLastAction
  } = recordingState;

  // Start recording
  const handleStartRecording = useCallback(async () => {
    if (isRecording) {
      console.log('[useRecordingActions] Already recording');
      return false;
    }

    console.log('[useRecordingActions] Starting recording');
    try {
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false
      });

      const success = await startRecording(selectedDeviceId, isSystemAudio);
      
      if (success) {
        setIsRecording(true);
        setIsPaused(false);
        
        setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: true
        });
        
        console.log('[useRecordingActions] Recording started successfully');
      } else {
        console.error('[useRecordingActions] Failed to start recording');
        
        setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: false,
          error: 'Failed to start recording'
        });
      }
      
      return success;
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
  }, [isRecording, selectedDeviceId, isSystemAudio, startRecording, setIsRecording, setIsPaused, setLastAction]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    if (!isRecording) {
      console.log('[useRecordingActions] Not recording, nothing to stop');
      return;
    }

    console.log('[useRecordingActions] Stopping recording');
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
      
      // Still need to update state even if there's an error
      setIsRecording(false);
      setIsPaused(false);
      
      throw error;
    }
  }, [isRecording, stopRecording, setIsRecording, setIsPaused, setLastAction]);

  // Pause recording
  const handlePauseRecording = useCallback(() => {
    if (!isRecording || isPaused) {
      console.log('[useRecordingActions] Cannot pause: not recording or already paused');
      return;
    }

    console.log('[useRecordingActions] Pausing recording');
    try {
      pauseRecording();
      setIsPaused(true);
      
      setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useRecordingActions] Recording paused successfully');
    } catch (error) {
      console.error('[useRecordingActions] Error pausing recording:', error);
      
      setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [isRecording, isPaused, pauseRecording, setIsPaused, setLastAction]);

  // Resume recording
  const handleResumeRecording = useCallback(() => {
    if (!isRecording || !isPaused) {
      console.log('[useRecordingActions] Cannot resume: not recording or not paused');
      return;
    }

    console.log('[useRecordingActions] Resuming recording');
    try {
      resumeRecording();
      setIsPaused(false);
      
      setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useRecordingActions] Recording resumed successfully');
    } catch (error) {
      console.error('[useRecordingActions] Error resuming recording:', error);
      
      setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [isRecording, isPaused, resumeRecording, setIsPaused, setLastAction]);

  return {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  };
};
