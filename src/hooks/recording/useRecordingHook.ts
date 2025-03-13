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

/**
 * Main hook that combines all recording functionality
 */
export const useRecording = () => {
  console.log('[useRecordingHook] Initializing hook');
  const initialized = useRef(false);
  
  // Main state
  const recordingState = useRecordingState();
  
  // Create a wrapped version of setSelectedDeviceId that adds logging
  const originalSetSelectedDeviceId = recordingState.setSelectedDeviceId;
  recordingState.setSelectedDeviceId = (deviceId: string | null) => {
    console.log('[useRecordingHook] setSelectedDeviceId called with:', deviceId);
    console.log('[useRecordingHook] Current state before update:', {
      selectedDeviceId: recordingState.selectedDeviceId,
      deviceSelectionReady: deviceSelectionReady,
      isRecording: recordingState.isRecording
    });
    
    // Call original function
    originalSetSelectedDeviceId(deviceId);
    
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

  // Log device selection state changes
  useEffect(() => {
    console.log('[useRecordingHook] Device selection state updated:', {
      deviceSelectionReady,
      audioDevicesCount: audioDevices.length,
      permissionState,
      selectedDeviceId: recordingState.selectedDeviceId
    });
  }, [deviceSelectionReady, audioDevices.length, permissionState, recordingState.selectedDeviceId]);

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

  // Save and delete functionality
  const { handleSaveRecording, handleDelete } = useSaveDeleteRecording(
    recordingState, 
    stopRecording, 
    recordingState.setLastAction
  );

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
    deviceSelectionReady, 
    recordingState.recordingAttemptsCount, 
    recordingState.isSystemAudio, 
    recordingState.lastAction
  );

  // Add new state for processing progress
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");

  // Update handleSaveRecording to pass progress callbacks
  const handleSaveRecording = useCallback(() => {
    if (!recordingSave) return;
    
    recordingSave.saveRecording(
      isRecording,
      handleStopRecording,
      mediaStream,
      audioUrl,
      recordedDuration
    );
  }, [
    recordingSave, 
    isRecording, 
    handleStopRecording, 
    mediaStream, 
    audioUrl, 
    recordedDuration
  ]);

  // Use the new progress information from useRecordingSave
  useEffect(() => {
    if (recordingSave) {
      setProcessingProgress(recordingSave.processingProgress || 0);
      setProcessingStage(recordingSave.processingStage || "");
    }
  }, [
    recordingSave?.processingProgress,
    recordingSave?.processingStage,
    recordingSave
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
    audioDevices,
    deviceSelectionReady,
    getCurrentDuration,
    initError,
    refreshDevices,
    devicesLoading,
    permissionState,
    processingProgress,
    processingStage
  };
};
