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
    if (audioDevices.length > 0 && recordingState.selectedDeviceId) {
      recordingState.setDeviceSelectionReady(true);
    } else {
      recordingState.setDeviceSelectionReady(false);
    }
  }, [recordingState.selectedDeviceId]);
  
  // Create a wrapped version of setSelectedDeviceId that adds logging
  // and prevents toasts on restricted routes
  const originalSetSelectedDeviceId = recordingState.setSelectedDeviceId;
  recordingState.setSelectedDeviceId = (deviceId: string | null) => {
    console.log('[useRecordingHook] setSelectedDeviceId called with:', deviceId);
    console.log('[useRecordingHook] Current state before update:', {
      selectedDeviceId: recordingState.selectedDeviceId,
      deviceSelectionReady: recordingState.deviceSelectionReady,
      isRecording: recordingState.isRecording,
      isRestrictedRoute: isRestrictedRoute()
    });
    
    // Call original function
    originalSetSelectedDeviceId(deviceId);
    
    // Only show toast if not on a restricted route and deviceId is provided
    if (deviceId && !isRestrictedRoute()) {
      console.log('[useRecordingHook] Would show toast for device selection, but route is restricted');
    }
    
    // Log after update (will show previous value due to closure)
    console.log('[useRecordingHook] State update initiated, will verify in next render');
    
    // Add timeout to verify state update
    setTimeout(() => {
      console.log('[useRecordingHook] State after update (timeout check):', {
        selectedDeviceId: recordingState.selectedDeviceId,
        deviceId
      });
    }, 100);
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
    recordingState.setDeviceSelectionReady(deviceSelectionReady);
  }, [deviceSelectionReady]);

  // Log device selection state changes
  useEffect(() => {
    console.log('[useRecordingHook] Device selection state updated:', {
      deviceSelectionReady,
      audioDevicesCount: audioDevices.length,
      permissionState,
      selectedDeviceId: recordingState.selectedDeviceId,
      isRestrictedRoute: isRestrictedRoute()
    });
  }, [deviceSelectionReady, audioDevices.length, permissionState, recordingState.selectedDeviceId, isRestrictedRoute]);

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

  // Set up action handlers
  const {
    handleStartRecording,
    handleStopRecording,
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

  // Save and delete functionality with toast suppression on restricted routes
  const originalHandleDelete = useSaveDeleteRecording(
    recordingState, 
    stopRecording, 
    recordingState.setLastAction
  ).handleDelete;
  
  // Wrap the delete handler to prevent toasts on restricted routes
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

  // Log state changes
  useRecordingLogger(
    recordingState.isRecording, 
    recordingState.isPaused, 
    recordingState.audioUrl, 
    recordingState.mediaStream, 
    recordingState.selectedDeviceId, 
    recordingState.deviceSelectionReady, 
    recordingState.recordingAttemptsCount, 
    recordingState.isSystemAudio, 
    recordingState.lastAction
  );

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

  // Start recording handler
  const handleStartRecording = useCallback(async () => {
    console.log('[useRecordingHook] Starting recording');
    try {
      if (isRecording) {
        console.warn('[useRecordingHook] Already recording, ignoring start request');
        return;
      }

      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false
      });

      const result = await startRecording();
      
      if (!result) {
        throw new Error('Failed to start recording');
      }

      setIsRecording(true);
      setIsPaused(false);
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingHook] Start recording error:', error);
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [isRecording, startRecording, setIsRecording, setIsPaused, setLastAction]);

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
