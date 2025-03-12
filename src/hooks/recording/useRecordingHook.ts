
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
import { useRef } from "react";

/**
 * Main hook that combines all recording functionality
 */
export const useRecording = () => {
  console.log('[useRecordingHook] Initializing hook');
  const initialized = useRef(false);
  
  // Main state
  const recordingState = useRecordingState();
  const {
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    audioUrl,
    setAudioUrl,
    mediaStream,
    setMediaStream,
    isSaving,
    setIsSaving,
    isTranscribing,
    setIsTranscribing,
    isSystemAudio,
    setIsSystemAudio,
    selectedDeviceId, 
    setSelectedDeviceId,
    lastAction,
    setLastAction,
    recordingAttemptsCount,
    setRecordingAttemptsCount
  } = recordingState;

  // Error handling
  const {
    initError,
    setInitError
  } = useRecordingError();

  // Device selection
  const {
    audioDevices,
    deviceSelectionReady
  } = useDeviceSelection();

  // Media stream handling
  const { streamManager } = useMediaStream(setLastAction);

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
  const { handleSystemAudioChange } = useSystemAudio(setIsSystemAudio);

  // Save and delete functionality
  const { handleSaveRecording, handleDelete } = useSaveDeleteRecording(
    recordingState, 
    stopRecording, 
    setLastAction
  );

  // Initialize recorder
  useRecorderInitialization(initializeRecorder, setInitError, selectedDeviceId);

  // Track recording attempts
  useRecordingAttemptTracker(isRecording, setRecordingAttemptsCount);

  // Log state changes
  useRecordingLogger(
    isRecording, 
    isPaused, 
    audioUrl, 
    mediaStream, 
    selectedDeviceId, 
    deviceSelectionReady, 
    recordingAttemptsCount, 
    isSystemAudio, 
    lastAction
  );

  console.log('[useRecordingHook] Hook initialized, returning methods');
  
  return {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    isSystemAudio,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    setIsSystemAudio: handleSystemAudioChange,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    deviceSelectionReady,
    getCurrentDuration,
    initError,
    recordingAttemptsCount,
    lastAction
  };
};
