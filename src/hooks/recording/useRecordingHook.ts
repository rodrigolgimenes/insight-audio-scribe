
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
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useRecordingSave } from "../record/useRecordingSave";
import { toast } from "sonner";

// Used to track if initial setup has happened
const globalInitialized = { value: false };

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
  
  // Use a ref to track if this is the initial render
  const isInitialRender = useRef(true);
  
  // Main state
  const recordingState = useRecordingState();
  
  // Set deviceSelectionReady if not already in the state - use effect with memoized dependencies
  useEffect(() => {
    // Only update if device selection isn't already ready and we have valid devices
    if (!recordingState.deviceSelectionReady && 
        audioDevices.length > 0 && 
        recordingState.selectedDeviceId) {
      recordingState.setDeviceSelectionReady(true);
    }
  }, [recordingState.selectedDeviceId, recordingState.deviceSelectionReady]);
  
  // Create a wrapped version of setSelectedDeviceId that adds logging
  // and prevents toasts on restricted routes
  const originalSetSelectedDeviceId = recordingState.setSelectedDeviceId;
  recordingState.setSelectedDeviceId = useCallback((deviceId: string | null) => {
    // Skip if it's the same ID to avoid unnecessary renders
    if (deviceId === recordingState.selectedDeviceId) {
      return;
    }
    
    console.log('[useRecordingHook] setSelectedDeviceId called with:', deviceId);
    
    // Call original function
    originalSetSelectedDeviceId(deviceId);
    
    // Only show toast if not on a restricted route and deviceId is provided
    if (deviceId && !isRestrictedRoute()) {
      toast.success("Microphone selected", {
        id: "mic-selected",
        duration: 2000
      });
    }
  }, [originalSetSelectedDeviceId, recordingState.selectedDeviceId, isRestrictedRoute]);

  // Error handling
  const {
    initError,
    setInitError
  } = useRecordingError();

  // Device selection - prevent re-initialization
  const {
    audioDevices,
    deviceSelectionReady,
    refreshDevices,
    devicesLoading,
    permissionState
  } = useMemo(() => {
    // If we've already initialized in this render cycle, return a stub
    if (globalInitialized.value) {
      return useDeviceSelection();
    } else {
      globalInitialized.value = true;
      const result = useDeviceSelection();
      return result;
    }
  }, []);

  // Update the recording state deviceSelectionReady when device selection changes 
  useEffect(() => {
    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    if (recordingState.deviceSelectionReady !== deviceSelectionReady) {
      recordingState.setDeviceSelectionReady(deviceSelectionReady);
    }
  }, [deviceSelectionReady, recordingState]);

  // Log device selection state changes
  useEffect(() => {
    // Only log when something actually changes to reduce console spam
    const stateChanged = isInitialRender.current ||
      recordingState.selectedDeviceId !== lastDeviceIdRef.current ||
      deviceSelectionReady !== lastSelectionReadyRef.current ||
      permissionState !== lastPermissionRef.current;
      
    if (stateChanged) {
      console.log('[useRecordingHook] Device selection state updated:', {
        deviceSelectionReady,
        audioDevicesCount: audioDevices.length,
        permissionState,
        selectedDeviceId: recordingState.selectedDeviceId,
        isRestrictedRoute: isRestrictedRoute()
      });
      
      // Update tracking refs
      lastDeviceIdRef.current = recordingState.selectedDeviceId;
      lastSelectionReadyRef.current = deviceSelectionReady;
      lastPermissionRef.current = permissionState;
      
      if (isInitialRender.current) {
        isInitialRender.current = false;
      }
    }
  }, [deviceSelectionReady, audioDevices.length, permissionState, recordingState.selectedDeviceId, isRestrictedRoute]);
  
  // Track previous values to detect changes
  const lastDeviceIdRef = useRef<string | null>(null);
  const lastSelectionReadyRef = useRef(false);
  const lastPermissionRef = useRef<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  // Media stream handling - memoize to prevent re-renders
  const { streamManager } = useMemo(() => 
    useMediaStream(recordingState.setLastAction), 
  [recordingState.setLastAction]);

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
  } = useMemo(() => 
    useRecordingLifecycle(recorder, recordingState),
  [recorder, recordingState]);

  // Set up action handlers with enhanced logging and validation
  const {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  } = useMemo(() => 
    useRecordingActions(
      recordingState,
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording
    ),
  [recordingState, startRecording, stopRecording, pauseRecording, resumeRecording]);

  // System audio handler
  const { handleSystemAudioChange } = useMemo(() => 
    useSystemAudio(recordingState.setIsSystemAudio),
  [recordingState.setIsSystemAudio]);

  // Save and delete functionality with toast suppression on restricted routes
  const { handleDelete: originalHandleDelete } = useMemo(() =>
    useSaveDeleteRecording(
      recordingState, 
      stopRecording, 
      recordingState.setLastAction
    ),
  [recordingState, stopRecording]);
  
  // Wrap the delete handler to prevent toasts on restricted routes
  const handleDelete = useCallback(() => {
    // Execute the original handler
    originalHandleDelete();
    
    // Only show toast if not on restricted route
    if (!isRestrictedRoute()) {
      toast.info("Recording deleted", {
        id: "recording-deleted"
      });
    }
  }, [originalHandleDelete, isRestrictedRoute]);

  // Initialize recorder only once
  useEffect(() => {
    if (!initialized.current) {
      useRecorderInitialization(initializeRecorder, setInitError, recordingState.selectedDeviceId);
      initialized.current = true;
    }
  }, [initializeRecorder, recordingState.selectedDeviceId, setInitError]);

  // Track recording attempts
  useEffect(() => {
    useRecordingAttemptTracker(recordingState.isRecording, recordingState.setRecordingAttemptsCount);
  }, [recordingState.isRecording, recordingState.setRecordingAttemptsCount]);

  // Log state changes
  useEffect(() => {
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
  }, [
    recordingState.isRecording, 
    recordingState.isPaused, 
    recordingState.audioUrl, 
    recordingState.mediaStream, 
    recordingState.selectedDeviceId, 
    recordingState.deviceSelectionReady, 
    recordingState.recordingAttemptsCount, 
    recordingState.isSystemAudio, 
    recordingState.lastAction
  ]);

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
  
  // Return memoized values to reduce re-renders
  return useMemo(() => ({
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
  }), [
    recordingState,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    handleSystemAudioChange,
    audioDevices,
    getCurrentDuration,
    initError,
    refreshDevices,
    devicesLoading,
    permissionState,
    processingProgress,
    processingStage,
    recordingSaveHook?.isProcessing,
    isRestrictedRoute
  ]);
};
