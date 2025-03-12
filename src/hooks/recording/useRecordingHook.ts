
import { useRecordingState } from "./useRecordingState";
import { useRecordingLifecycle } from "./useRecordingLifecycle";
import { useDeviceSelection } from "./useDeviceSelection";
import { useRecordingActions } from "./useRecordingActions";
import { useMediaStream } from "./useMediaStream";
import { useRecordingError } from "./useRecordingError";
import { useSimpleRecorder } from "./useSimpleRecorder";
import { useSaveDeleteRecording } from "./lifecycle/useSaveDeleteRecording";
import { useSystemAudio } from "./useSystemAudio";
import { useState, useEffect, useRef } from "react";

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

  // Initialize recorder once
  useEffect(() => {
    if (initialized.current) {
      console.log('[useRecordingHook] Already initialized, skipping');
      return;
    }
    
    console.log('[useRecordingHook] Initializing recorder...');
    let cleanup = () => {};
    
    try {
      cleanup = initializeRecorder();
      console.log('[useRecordingHook] Recorder initialized successfully');
      initialized.current = true;
    } catch (error) {
      console.error('[useRecordingHook] Error initializing recorder:', error);
      setInitError(error instanceof Error ? error : new Error('Unknown error initializing recorder'));
    }
    
    return () => {
      console.log('[useRecordingHook] Cleaning up recorder');
      cleanup();
    };
  }, [initializeRecorder, setInitError]);

  // Clear any initialization errors when device selection changes
  useEffect(() => {
    if (selectedDeviceId) {
      setInitError(null);
      console.log('[useRecordingHook] Device selected, cleared init error');
    }
  }, [selectedDeviceId, setInitError]);

  // Log state changes
  useEffect(() => {
    console.log('[useRecordingHook] State updated:', { 
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
    console.log('[useRecordingHook] MediaRecorder supported:', hasMediaRecorder);
    
    if (hasMediaRecorder) {
      console.log(
        '[useRecordingHook] MediaRecorder.isTypeSupported:',
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
      console.log('[useRecordingHook] Incrementing recording attempts count');
    }
  }, [isRecording, setRecordingAttemptsCount]);

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
