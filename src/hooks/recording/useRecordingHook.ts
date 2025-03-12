
import { useRecordingState } from "./useRecordingState";
import { useRecordingLifecycle } from "./useRecordingLifecycle";
import { useDeviceSelection } from "./useDeviceSelection";
import { useRecordingActions } from "./useRecordingActions";
import { useMediaStream } from "./useMediaStream";
import { useRecordingError } from "./useRecordingError";
import { useSimpleRecorder } from "./useSimpleRecorder";
import { useSaveDeleteRecording } from "./lifecycle/useSaveDeleteRecording";
import { useSystemAudio } from "./useSystemAudio";
import { useState, useEffect } from "react";

/**
 * Main hook that combines all recording functionality
 */
export const useRecording = () => {
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
  useEffect(() => {
    console.log('[useRecording] Initializing recorder...');
    let cleanup = () => {};
    
    try {
      cleanup = initializeRecorder();
      console.log('[useRecording] Recorder initialized successfully');
    } catch (error) {
      console.error('[useRecording] Error initializing recorder:', error);
      setInitError(error instanceof Error ? error : new Error('Unknown error initializing recorder'));
    }
    
    return () => {
      console.log('[useRecording] Cleaning up recorder');
      cleanup();
    };
  }, [initializeRecorder, setInitError]);

  // Clear any initialization errors when device selection changes
  useEffect(() => {
    if (selectedDeviceId) {
      setInitError(null);
      console.log('[useRecording] Device selected, cleared init error');
    }
  }, [selectedDeviceId, setInitError]);

  // Log state changes
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
      lastAction: lastAction ? lastAction.action : null
    });

    // Log info about MediaRecorder support
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    console.log('[useRecording] MediaRecorder supported:', hasMediaRecorder);
    
    if (hasMediaRecorder) {
      console.log(
        '[useRecording] MediaRecorder.isTypeSupported:',
        'audio/webm;codecs=opus', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
        'audio/webm', MediaRecorder.isTypeSupported('audio/webm'),
        'audio/mp4', MediaRecorder.isTypeSupported('audio/mp4')
      );
    }
  }, [
    isRecording, 
    isPaused, 
    audioUrl, 
    mediaStream, 
    selectedDeviceId, 
    deviceSelectionReady, 
    recordingAttemptsCount, 
    isSystemAudio, 
    lastAction
  ]);

  // Track recording attempts
  useEffect(() => {
    if (isRecording) {
      setRecordingAttemptsCount(prev => prev + 1);
      console.log('[useRecording] Incrementing recording attempts count');
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
