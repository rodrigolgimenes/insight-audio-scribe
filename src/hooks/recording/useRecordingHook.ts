
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
import { useRecordingLogger } from "./useRecordingLogger";
import { useRecordingAttemptTracker } from "./useRecordingAttemptTracker";

/**
 * Main hook that combines all recording functionality
 */
export const useRecording = () => {
  // Main state
  const recordingState = useRecordingState();
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    isSystemAudio,
    setIsSystemAudio,
    selectedDeviceId, 
    setSelectedDeviceId,
    setLastAction
  } = recordingState;

  // Error handling
  const {
    initError,
    setInitError,
    recordingAttemptsCount,
    setRecordingAttemptsCount,
    lastAction
  } = useRecordingError();

  // Merge the setLastAction into recordingState for easier access
  const enhancedRecordingState = {
    ...recordingState,
    setLastAction,
    recordingAttemptsCount,
    setRecordingAttemptsCount
  };

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
  } = useRecordingLifecycle(recorder, enhancedRecordingState);

  // Set up action handlers
  const {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  } = useRecordingActions(
    enhancedRecordingState,
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

  // Track recording attempts
  useRecordingAttemptTracker(isRecording, setRecordingAttemptsCount);

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
