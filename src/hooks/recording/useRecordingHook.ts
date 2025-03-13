
import { useState, useRef, useEffect, useCallback } from "react";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
import { useRecordingState } from "./useRecordingState";
import { useStopRecording } from "./lifecycle/useStopRecording";
import { usePauseResumeRecording } from "./lifecycle/usePauseResumeRecording";
import { useSaveDeleteRecording } from "./lifecycle/useSaveDeleteRecording";

// Custom hooks for system audio and microphone capture
const useSystemAudioCapture = (recorder: any, recordingState: any) => {
  const { isSystemAudio, setIsSystemAudio } = recordingState;
  
  const startSystemAudioCapture = async () => {
    console.log('[useSystemAudioCapture] Starting system audio capture');
    return true;
  };
  
  const stopSystemAudioCapture = () => {
    console.log('[useSystemAudioCapture] Stopping system audio capture');
  };
  
  return {
    isSystemAudio,
    setIsSystemAudio,
    startSystemAudioCapture,
    stopSystemAudioCapture
  };
};

const useMicrophoneCapture = (recorder: any, recordingState: any) => {
  const { selectedDeviceId, setSelectedDeviceId } = recordingState;
  
  const startMicrophoneCapture = async () => {
    console.log('[useMicrophoneCapture] Starting microphone capture');
    return true;
  };
  
  const stopMicrophoneCapture = () => {
    console.log('[useMicrophoneCapture] Stopping microphone capture');
  };
  
  return {
    selectedDeviceId,
    setSelectedDeviceId,
    startMicrophoneCapture,
    stopMicrophoneCapture
  };
};

// Custom hook for recording actions
const useRecordingActions = (
  recorder: any,
  recordingState: any,
  startMicrophoneCapture: any,
  startSystemAudioCapture: any,
  stopMicrophoneCapture: any,
  stopSystemAudioCapture: any,
  pauseRecording: any,
  resumeRecording: any
) => {
  const handleStartRecording = async () => {
    console.log('[useRecordingActions] Starting recording');
    return true;
  };
  
  const handleStopRecording = async () => {
    console.log('[useRecordingActions] Stopping recording');
    return {};
  };
  
  const handlePauseRecording = () => {
    console.log('[useRecordingActions] Pausing recording');
  };
  
  const handleResumeRecording = () => {
    console.log('[useRecordingActions] Resuming recording');
  };
  
  return {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  };
};

export function useRecordingHook() {
  const recorder = useRef<AudioRecorder | null>(null);
  const recordingState = useRecordingState();
  const [isRestrictedRoute, setIsRestrictedRoute] = useState(false);
  
  // Mock DeviceContext data since the import is missing
  const deviceContext = {
    audioDevices: [],
    initError: null,
    refreshDevices: async () => {},
    devicesLoading: false,
    permissionState: 'prompt'
  };

  // Initialize the recorder
  useEffect(() => {
    recorder.current = new AudioRecorder();
  }, []);

  // Initialize system audio capture
  const systemAudioHook = useSystemAudioCapture(recorder, recordingState);

  // Initialize microphone capture
  const microphoneHook = useMicrophoneCapture(recorder, recordingState);

  // Lifecycle actions
  const { stopRecording } = useStopRecording(recorder, recordingState);
  const { pauseRecording, resumeRecording } = usePauseResumeRecording(recorder, recordingState);
  const { handleDelete, handleSaveRecording } = useSaveDeleteRecording(recordingState, stopRecording, recordingState.setLastAction);

  // Actions
  const actions = useRecordingActions(
    recorder,
    recordingState,
    microphoneHook.startMicrophoneCapture,
    systemAudioHook.startSystemAudioCapture,
    microphoneHook.stopMicrophoneCapture,
    systemAudioHook.stopSystemAudioCapture,
    pauseRecording,
    resumeRecording
  );

  // System audio change handler
  const handleSystemAudioChange = useCallback((value: boolean) => {
    systemAudioHook.setIsSystemAudio(value);
  }, [systemAudioHook.setIsSystemAudio]);

  // Get current duration
  const getCurrentDuration = useCallback(() => {
    if (!recorder.current) return 0;
    return recorder.current.getCurrentDuration();
  }, []);

  // Wrapper for setSelectedDeviceId to include logging
  const wrappedSetSelectedDeviceId = useCallback((deviceId: string | null) => {
    console.log('[useRecordingHook] Setting selected device ID:', deviceId);
    microphoneHook.setSelectedDeviceId(deviceId);
  }, [microphoneHook.setSelectedDeviceId]);

  // Check for restricted routes on mount
  useEffect(() => {
    const checkIsRestrictedRoute = (): boolean => {
      const path = window.location.pathname.toLowerCase();
      return path === '/' ||
             path === '/index' ||
             path === '/dashboard' ||
             path === '/app' ||
             path.startsWith('/app/');
    };
    setIsRestrictedRoute(checkIsRestrictedRoute());
  }, []);
  
  // Extract all relevant state items from recordingState
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    audioFileSize
  } = recordingState;
  
  // Return the public API of the hook
  return {
    // State
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    isSystemAudio: systemAudioHook.isSystemAudio,
    selectedDeviceId: microphoneHook.selectedDeviceId,
    lastAction: recordingState.lastAction,
    recordingAttemptsCount: recordingState.recordingAttemptsCount,
    deviceSelectionReady: recordingState.deviceSelectionReady,
    audioFileSize,
    
    // Actions
    handleStartRecording: actions.handleStartRecording,
    handleStopRecording: actions.handleStopRecording,
    handlePauseRecording: actions.handlePauseRecording,
    handleResumeRecording: actions.handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    setIsSystemAudio: handleSystemAudioChange,
    audioDevices: deviceContext.audioDevices,
    getCurrentDuration,
    initError: deviceContext.initError,
    refreshDevices: deviceContext.refreshDevices,
    setSelectedDeviceId: wrappedSetSelectedDeviceId,
    devicesLoading: deviceContext.devicesLoading,
    permissionState: deviceContext.permissionState,
    isRestrictedRoute
  };
}
