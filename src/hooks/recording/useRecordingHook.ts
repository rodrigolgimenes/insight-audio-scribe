
import { useEffect } from "react";
import { useRecordingState } from "./useRecordingState";
import { useRecordingLifecycle } from "./useRecordingLifecycle";
import { useDeviceSelection } from "./useDeviceSelection";
import { useRecordingActions } from "./useRecordingActions";
import { useMediaStream } from "./useMediaStream";
import { useRecordingError } from "./useRecordingError";

/**
 * Main hook that combines all recording functionality
 */
export const useRecording = () => {
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
  } = recordingState;

  const {
    initError,
    setInitError,
    recordingAttemptsCount,
    setRecordingAttemptsCount,
    lastAction,
    setLastAction,
  } = useRecordingError();

  const {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    deviceSelectionReady
  } = useDeviceSelection();

  const { streamManager } = useMediaStream(setLastAction);

  const {
    recorder,
    getCurrentDuration,
    initializeRecorder,
  } = useRecordingLifecycle();

  const {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    handleSystemAudioChange,
  } = useRecordingActions(
    recordingState,
    selectedDeviceId,
    streamManager,
    recorder,
    setLastAction
  );

  // Initialize recorder
  useEffect(() => {
    console.log('[useRecording] Initializing recorder...');
    try {
      const cleanup = initializeRecorder();
      console.log('[useRecording] Recorder initialized successfully');
      
      return cleanup;
    } catch (error) {
      console.error('[useRecording] Error initializing recorder:', error);
      setInitError(error instanceof Error ? error : new Error('Unknown error initializing recorder'));
      return () => {};
    }
  }, [initializeRecorder, setInitError]);

  // Clear any initialization errors when device selection changes
  useEffect(() => {
    if (selectedDeviceId) {
      setInitError(null);
      console.log('[useRecording] Device selected, cleared init error');
    }
  }, [selectedDeviceId, setInitError]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('[useRecording] State updated:', { 
      isRecording, 
      isPaused, 
      audioUrl: audioUrl ? 'exists' : 'null',
      mediaStream: mediaStream ? 'exists' : 'null',
      selectedDeviceId,
      deviceSelectionReady,
      recordingAttemptsCount,
      isSystemAudio,
      lastAction
    });
    
    // Add console logs to see browser support for MediaRecorder
    if (typeof window !== 'undefined') {
      console.log('[useRecording] MediaRecorder supported:', 'MediaRecorder' in window);
      if ('MediaRecorder' in window) {
        console.log('[useRecording] MediaRecorder.isTypeSupported:', 
          'audio/webm;codecs=opus', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
          'audio/webm', MediaRecorder.isTypeSupported('audio/webm'),
          'audio/mp4', MediaRecorder.isTypeSupported('audio/mp4')
        );
      }
    }
  }, [isRecording, isPaused, audioUrl, mediaStream, selectedDeviceId, deviceSelectionReady, recordingAttemptsCount, isSystemAudio, lastAction]);

  // Increment recording attempts count before starting
  useEffect(() => {
    if (isRecording) {
      setRecordingAttemptsCount(prev => prev + 1);
    }
  }, [isRecording, setRecordingAttemptsCount]);

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
