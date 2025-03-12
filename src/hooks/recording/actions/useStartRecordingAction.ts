
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";

/**
 * Hook for handling the start recording action
 */
export const useStartRecordingAction = (
  isRecording: boolean,
  selectedDeviceId: string | null,
  isSystemAudio: boolean,
  startRecording: (deviceId: string | null, isSystemAudio: boolean) => Promise<boolean>,
  setIsRecording: (value: boolean) => void,
  setIsPaused: (value: boolean) => void,
  setLastAction: (action: { action: string; timestamp: number; success: boolean; error?: string } | null) => void
) => {
  const handleStartRecording = useCallback(async () => {
    if (isRecording) {
      console.log('[useStartRecordingAction] Already recording');
      return false;
    }

    console.log('[useStartRecordingAction] Starting recording');
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
        
        console.log('[useStartRecordingAction] Recording started successfully');
      } else {
        console.error('[useStartRecordingAction] Failed to start recording');
        
        setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: false,
          error: 'Failed to start recording'
        });
      }
      
      return success;
    } catch (error) {
      console.error('[useStartRecordingAction] Error starting recording:', error);
      
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }, [isRecording, selectedDeviceId, isSystemAudio, startRecording, setIsRecording, setIsPaused, setLastAction]);

  return handleStartRecording;
};
