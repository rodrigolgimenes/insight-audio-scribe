
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";

export function useRecordingActions(
  recordingState: RecordingStateType,
  startMicrophoneCapture: (deviceId: string | null) => Promise<boolean>,
  stopMicrophoneCapture: () => void
) {
  const { 
    setIsRecording, 
    setIsPaused,
    isRecording,
    isPaused,
    selectedDeviceId,
    setLastAction
  } = recordingState;

  // Start recording
  const handleStartRecording = useCallback(async () => {
    console.log('[useRecordingActions] Starting recording with device ID:', selectedDeviceId);
    
    if (isRecording) {
      console.log('[useRecordingActions] Already recording, ignoring start request');
      return;
    }
    
    setLastAction({
      action: 'Start recording',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      const success = await startMicrophoneCapture(selectedDeviceId);
      
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
        setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: false,
          error: 'Failed to start recording'
        });
        
        console.error('[useRecordingActions] Failed to start recording');
      }
    } catch (error) {
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('[useRecordingActions] Error starting recording:', error);
    }
  }, [isRecording, selectedDeviceId, setIsRecording, setIsPaused, setLastAction, startMicrophoneCapture]);

  // Pause recording
  const handlePauseRecording = useCallback(() => {
    console.log('[useRecordingActions] Pausing recording');
    
    if (!isRecording || isPaused) {
      console.log('[useRecordingActions] Not recording or already paused, ignoring pause request');
      return;
    }
    
    setLastAction({
      action: 'Pause recording',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      // Implement pause logic
      setIsPaused(true);
      
      setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useRecordingActions] Recording paused successfully');
    } catch (error) {
      setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('[useRecordingActions] Error pausing recording:', error);
    }
  }, [isRecording, isPaused, setIsPaused, setLastAction]);

  // Resume recording
  const handleResumeRecording = useCallback(() => {
    console.log('[useRecordingActions] Resuming recording');
    
    if (!isRecording || !isPaused) {
      console.log('[useRecordingActions] Not recording or not paused, ignoring resume request');
      return;
    }
    
    setLastAction({
      action: 'Resume recording',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      // Implement resume logic
      setIsPaused(false);
      
      setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useRecordingActions] Recording resumed successfully');
    } catch (error) {
      setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error('[useRecordingActions] Error resuming recording:', error);
    }
  }, [isRecording, isPaused, setIsPaused, setLastAction]);

  return {
    handleStartRecording,
    handlePauseRecording,
    handleResumeRecording
  };
}
