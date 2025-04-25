
import { useRecordingState } from "./useRecordingState";
import { useRecordingLifecycle } from "./useRecordingLifecycle";
import { useDeviceSelection } from "./useDeviceSelection";
import { useRecordingActions } from "./useRecordingActions";
import { useMediaStream } from "./useMediaStream";
import { useRecordingError } from "./useRecordingError";
import { useSimpleRecorder } from "./useSimpleRecorder";
import { useSaveDeleteRecording } from "./lifecycle/useSaveDeleteRecording";
import { useSystemAudio } from "./useSystemAudio";
import { useRecorderInitialization } from "./useRecorderInitialization";
import { useRecordingAttemptTracker } from "./useRecordingAttemptTracker";
import { useRecordingLogger } from "./useRecordingLogger";
import { useRef, useEffect, useState, useCallback } from "react";
import { useRecordingSave } from "../record/useRecordingSave";
import { toast } from "sonner";

/**
 * Main hook that combines all recording functionality
 */
export const useRecording = () => {
  console.log('[useRecordingHook] Initializing hook');
  const initialized = useRef(false);
  
  // Check if we're on a restricted route (index, dashboard, or app routes)
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);
  
  // Main state
  const recordingState = useRecordingState();
  
  // Set deviceSelectionReady if not already in the state
  useEffect(() => {
    // Set deviceSelectionReady based on available devices and selected device
    if (recordingState.recordingMode === 'screen' || 
        (audioDevices.length > 0 && recordingState.selectedDeviceId)) {
      recordingState.setDeviceSelectionReady(true);
    } else {
      recordingState.setDeviceSelectionReady(false);
    }
  }, [recordingState.selectedDeviceId, recordingState.recordingMode]);
  
  // Create a wrapped version of setSelectedDeviceId that adds logging
  const originalSetSelectedDeviceId = recordingState.setSelectedDeviceId;
  recordingState.setSelectedDeviceId = (deviceId: string | null) => {
    console.log('[useRecordingHook] setSelectedDeviceId called with:', deviceId);
    
    // Call original function
    originalSetSelectedDeviceId(deviceId);
    
    // Only show toast if not on a restricted route and deviceId is provided
    if (deviceId && !isRestrictedRoute()) {
      console.log('[useRecordingHook] Would show toast for device selection, but route is restricted');
    }
  };

  // Error handling
  const {
    initError,
    setInitError
  } = useRecordingError();

  // Device selection
  const {
    audioDevices,
    deviceSelectionReady,
    refreshDevices,
    devicesLoading,
    permissionState
  } = useDeviceSelection();

  // Update the recording state deviceSelectionReady when device selection changes
  useEffect(() => {
    if (recordingState.recordingMode === 'screen') {
      recordingState.setDeviceSelectionReady(true);
    } else {
      recordingState.setDeviceSelectionReady(deviceSelectionReady);
    }
  }, [deviceSelectionReady, recordingState.recordingMode]);

  // Media stream handling
  const { streamManager } = useMediaStream(recordingState.setLastAction);

  // Recording operations
  const { 
    recorder,
    getCurrentDuration,
    initializeRecorder
  } = useSimpleRecorder();

  // Set up lifecycle methods
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  } = useRecordingLifecycle(recorder, recordingState);

  // Toggle recording mode
  const toggleRecordingMode = useCallback(() => {
    recordingState.setRecordingMode(prev => prev === 'audio' ? 'screen' : 'audio');
  }, [recordingState]);

  // Modify start recording to handle different modes
  const handleStartRecording = useCallback(async () => {
    if (recordingState.isRecording) {
      console.log('[useRecordingHook] Already recording, ignoring start request');
      return;
    }

    console.log('[useRecordingHook] Starting recording in mode:', recordingState.recordingMode);
    recordingState.setLastAction({
      action: `Start ${recordingState.recordingMode} recording`,
      timestamp: Date.now(),
      success: false
    });

    try {
      // Get media stream based on recording mode
      let stream = null;
      
      if (recordingState.recordingMode === 'screen') {
        // Get display media for screen recording
        stream = await streamManager.requestScreenAccess(recordingState.isSystemAudio);
      } else {
        // Get microphone for audio recording
        stream = await streamManager.requestMicrophoneAccess(
          recordingState.selectedDeviceId,
          recordingState.isSystemAudio
        );
      }
      
      if (!stream) {
        throw new Error(`Failed to get ${recordingState.recordingMode} stream`);
      }

      // Set the media stream
      recordingState.setMediaStream(stream);
      
      // Start the recording
      const result = await startRecording(recordingState.selectedDeviceId, recordingState.isSystemAudio);
      
      if (!result) {
        throw new Error(`Failed to start ${recordingState.recordingMode} recording`);
      }

      recordingState.setIsRecording(true);
      
      // Log success
      recordingState.setLastAction({
        action: `Start ${recordingState.recordingMode} recording`,
        timestamp: Date.now(),
        success: true
      });
      
      // Don't show notification on restricted routes
      if (!isRestrictedRoute()) {
        toast.success(`${recordingState.recordingMode === 'audio' ? 'Audio' : 'Screen'} recording started`);
      }
      
    } catch (error) {
      console.error('[useRecordingHook] Error starting recording:', error);
      
      recordingState.setLastAction({
        action: `Start ${recordingState.recordingMode} recording`,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't show notification on restricted routes
      if (!isRestrictedRoute()) {
        toast.error(`Could not start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [
    recordingState.isRecording,
    recordingState.recordingMode,
    recordingState.selectedDeviceId,
    recordingState.isSystemAudio,
    recordingState.setIsRecording,
    recordingState.setMediaStream,
    recordingState.setLastAction,
    startRecording,
    streamManager,
    isRestrictedRoute
  ]);

  // Modified stop recording handler
  const handleStopRecording = useCallback(async () => {
    if (!recordingState.isRecording) {
      console.log('[useRecordingHook] Not recording, ignoring stop request');
      return { success: false };
    }
    
    try {
      recordingState.setLastAction({
        action: `Stop ${recordingState.recordingMode} recording`,
        timestamp: Date.now(),
        success: false
      });
      
      const result = await stopRecording();
      recordingState.setIsRecording(false);
      recordingState.setIsPaused(false);
      
      recordingState.setLastAction({
        action: `Stop ${recordingState.recordingMode} recording`,
        timestamp: Date.now(),
        success: true
      });
      
      // Don't show notification on restricted routes
      if (!isRestrictedRoute()) {
        toast.success(`${recordingState.recordingMode === 'audio' ? 'Audio' : 'Screen'} recording stopped`);
      }
      
      return result;
    } catch (error) {
      console.error('[useRecordingHook] Error stopping recording:', error);
      
      recordingState.setLastAction({
        action: `Stop ${recordingState.recordingMode} recording`,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't show notification on restricted routes
      if (!isRestrictedRoute()) {
        toast.error(`Error stopping recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      return { success: false, error };
    }
  }, [recordingState, stopRecording, isRestrictedRoute]);

  // Set up action handlers for pause/resume
  const {
    handlePauseRecording,
    handleResumeRecording
  } = useRecordingActions(
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  );

  // System audio handler
  const { handleSystemAudioChange } = useSystemAudio(recordingState.setIsSystemAudio);

  // Wrap the delete handler to prevent toasts on restricted routes
  const originalHandleDelete = useSaveDeleteRecording(
    recordingState, 
    stopRecording, 
    recordingState.setLastAction
  ).handleDelete;
  
  const handleDelete = () => {
    // Execute the original handler
    originalHandleDelete();
    
    // Only show toast if not on restricted route
    if (!isRestrictedRoute()) {
      toast.info("Recording deleted", {
        id: "recording-deleted"
      });
    }
  };

  // Initialize recorder
  useRecorderInitialization(initializeRecorder, setInitError, recordingState.selectedDeviceId);

  // Track recording attempts
  useRecordingAttemptTracker(recordingState.isRecording, recordingState.setRecordingAttemptsCount);

  // Add new state for processing progress
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  
  // Initialize recording save hook
  const recordingSaveHook = useRecordingSave();

  // Create save recording handler
  const handleSaveRecording = useCallback(() => {
    if (!recordingSaveHook) return;
    
    recordingSaveHook.saveRecording(
      recordingState.isRecording,
      handleStopRecording,
      recordingState.mediaStream,
      recordingState.audioUrl,
      getCurrentDuration ? getCurrentDuration() : 0
    );
  }, [
    recordingSaveHook, 
    recordingState.isRecording, 
    handleStopRecording, 
    recordingState.mediaStream, 
    recordingState.audioUrl, 
    getCurrentDuration
  ]);

  // Use the new progress information from useRecordingSave
  useEffect(() => {
    if (recordingSaveHook) {
      setProcessingProgress(recordingSaveHook.processingProgress || 0);
      setProcessingStage(recordingSaveHook.processingStage || "");
    }
  }, [
    recordingSaveHook?.processingProgress,
    recordingSaveHook?.processingStage,
    recordingSaveHook
  ]);

  console.log('[useRecordingHook] Hook initialized, returning methods');
  
  return {
    ...recordingState,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    setIsSystemAudio: handleSystemAudioChange,
    toggleRecordingMode,
    audioDevices,
    deviceSelectionReady: recordingState.deviceSelectionReady,
    getCurrentDuration,
    initError,
    refreshDevices,
    devicesLoading,
    permissionState,
    processingProgress,
    processingStage,
    isLoading: recordingSaveHook?.isProcessing || false,
    isRestrictedRoute: isRestrictedRoute()
  };
};
