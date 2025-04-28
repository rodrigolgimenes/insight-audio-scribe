import { useCallback } from "react";
import { RecordingStateType } from "./useRecordingState";
import { RecordingValidator } from "@/utils/audio/recordingValidator";
import { toast } from "sonner";

export const useRecordingActions = (
  recordingState: RecordingStateType,
  startRecording: (deviceId: string | null, isSystemAudio: boolean) => Promise<boolean>,
  stopRecording: () => Promise<any>,
  pauseRecording: () => void,
  resumeRecording: () => void
) => {
  const isRestrictedRoute = () => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  };

  // Handler for starting recording
  const handleStartRecording = useCallback(async () => {
    console.log('[useRecordingActions] Start recording requested');
    
    // Log validation diagnostics
    RecordingValidator.logDiagnostics({
      selectedDeviceId: recordingState.selectedDeviceId,
      deviceSelectionReady: recordingState.deviceSelectionReady,
      audioDevices: recordingState.audioDevices,
      isRecording: recordingState.isRecording,
      permissionState: recordingState.permissionState
    });
    
    // If we're already recording, don't do anything
    if (recordingState.isRecording) {
      console.log('[useRecordingActions] Already recording, ignoring start request');
      return false;
    }

    try {
      // Simplified validation - just check permission status
      const canStart = recordingState.permissionState !== 'denied';
      
      if (!canStart) {
        console.log('[useRecordingActions] Cannot start recording due to denied permission');
        
        // Set a detailed action log
        recordingState.setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: false,
          error: 'Microphone access denied'
        });
        
        // Only show toast on non-restricted routes
        if (!isRestrictedRoute()) {
          toast.error("Microphone access denied", {
            description: "Please allow microphone access in your browser settings",
          });
        }
        
        return false;
      }
      
      // Set recording flag optimistically to improve perceived performance
      recordingState.setIsRecording(true);
      
      // Start recording with current device
      console.log('[useRecordingActions] Starting recording with device:', recordingState.selectedDeviceId);
      const result = await startRecording(recordingState.selectedDeviceId, recordingState.isSystemAudio);
      
      if (result) {
        console.log('[useRecordingActions] Recording started successfully');
        recordingState.setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: true
        });
        
        return true;
      } else {
        console.log('[useRecordingActions] Failed to start recording');
        // Reset recording flag since it failed
        recordingState.setIsRecording(false);
        
        recordingState.setLastAction({
          action: 'Start recording',
          timestamp: Date.now(),
          success: false,
          error: 'Failed to start recording'
        });
        
        // Only show toast on non-restricted routes
        if (!isRestrictedRoute()) {
          toast.error("Failed to start recording", {
            description: "Please try again or check your microphone settings",
          });
        }
        
        return false;
      }
    } catch (error) {
      console.error('[useRecordingActions] Error in handleStartRecording:', error);
      
      // Reset recording flag since it failed
      recordingState.setIsRecording(false);
      
      recordingState.setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Only show toast on non-restricted routes
      if (!isRestrictedRoute()) {
        toast.error("Error starting recording", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
      
      return false;
    }
  }, [
    recordingState.audioDevices,
    recordingState.deviceSelectionReady,
    recordingState.isRecording,
    recordingState.isSystemAudio,
    recordingState.permissionState,
    recordingState.selectedDeviceId,
    recordingState.setIsRecording,
    recordingState.setLastAction,
    startRecording
  ]);

  // Handler for stopping recording
  const handleStopRecording = useCallback(async () => {
    console.log('[useRecordingActions] Stop recording requested');
    
    if (!recordingState.isRecording) {
      console.log('[useRecordingActions] Not recording, ignoring stop request');
      return null;
    }
    
    try {
      const result = await stopRecording();
      
      console.log('[useRecordingActions] Recording stopped successfully');
      recordingState.setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: true
      });
      
      return result;
    } catch (error) {
      console.error('[useRecordingActions] Error in handleStopRecording:', error);
      
      recordingState.setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Only show toast on non-restricted routes
      if (!isRestrictedRoute()) {
        toast.error("Error stopping recording", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
      
      return null;
    }
  }, [recordingState.isRecording, recordingState.setLastAction, stopRecording]);

  // Handler for pausing recording
  const handlePauseRecording = useCallback(() => {
    console.log('[useRecordingActions] Pause recording requested');
    
    if (!recordingState.isRecording || recordingState.isPaused) {
      console.log('[useRecordingActions] Not recording or already paused, ignoring pause request');
      return;
    }
    
    try {
      pauseRecording();
      
      console.log('[useRecordingActions] Recording paused successfully');
      recordingState.setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingActions] Error in handlePauseRecording:', error);
      
      recordingState.setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Only show toast on non-restricted routes
      if (!isRestrictedRoute()) {
        toast.error("Error pausing recording", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  }, [recordingState.isRecording, recordingState.isPaused, recordingState.setLastAction, pauseRecording]);

  // Handler for resuming recording
  const handleResumeRecording = useCallback(() => {
    console.log('[useRecordingActions] Resume recording requested');
    
    if (!recordingState.isRecording || !recordingState.isPaused) {
      console.log('[useRecordingActions] Not recording or not paused, ignoring resume request');
      return;
    }
    
    try {
      resumeRecording();
      
      console.log('[useRecordingActions] Recording resumed successfully');
      recordingState.setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingActions] Error in handleResumeRecording:', error);
      
      recordingState.setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Only show toast on non-restricted routes
      if (!isRestrictedRoute()) {
        toast.error("Error resuming recording", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  }, [recordingState.isRecording, recordingState.isPaused, recordingState.setLastAction, resumeRecording]);

  return {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  };
};
