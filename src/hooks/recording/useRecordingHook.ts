
import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
import { useSystemAudioCapture } from "./capture/useSystemAudio";
import { useMicrophoneCapture } from "./capture/useMicrophone";
import { useRecordingState } from "./useRecordingState";
import { useStopRecording } from "./lifecycle/useStopRecording";
import { usePauseResumeRecording } from "./lifecycle/usePauseResumeRecording";
import { useSaveDeleteRecording } from "./lifecycle/useSaveDeleteRecording";
import { useRecordingActions } from "./actions/useRecordingActions";
import { DeviceContext } from "@/components/providers/DeviceProvider";
import { toAudioDevice } from "../recording/capture/types";

export function useRecordingHook() {
  const recorder = useRef<AudioRecorder | null>(null);
  const recordingState = useRecordingState();
  const [isRestrictedRoute, setIsRestrictedRoute] = useState(false);
  
  // Use device context
  const deviceContext = useContext(DeviceContext);

  // Initialize the recorder
  useEffect(() => {
    recorder.current = new AudioRecorder();
  }, []);

  // Convert MediaDeviceInfo[] to AudioDevice[]
  const audioDevices = deviceContext.audioDevices.map((device, index) => 
    toAudioDevice(device, device.deviceId === 'default', index)
  );

  // Initialize system audio capture
  const {
    startSystemAudioCapture,
    stopSystemAudioCapture,
    isSystemAudio: captureIsSystemAudio,
    setIsSystemAudio
  } = useSystemAudioCapture(recorder, recordingState);

  // Initialize microphone capture
  const {
    startMicrophoneCapture,
    stopMicrophoneCapture,
    selectedDeviceId: captureSelectedDeviceId,
    setSelectedDeviceId
  } = useMicrophoneCapture(recorder, recordingState);

  // Lifecycle actions
  const { stopRecording } = useStopRecording(recorder, recordingState);
  const { pauseRecording, resumeRecording } = usePauseResumeRecording(recorder, recordingState);
  const { handleDelete, handleSaveRecording } = useSaveDeleteRecording(recordingState, stopRecording);

  // Actions
  const {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  } = useRecordingActions(
    recorder,
    recordingState,
    startMicrophoneCapture,
    startSystemAudioCapture,
    stopMicrophoneCapture,
    stopSystemAudioCapture,
    pauseRecording,
    resumeRecording
  );

  // System audio change handler
  const handleSystemAudioChange = useCallback((value: boolean) => {
    setIsSystemAudio(value);
  }, [setIsSystemAudio]);

  // Get current duration
  const getCurrentDuration = useCallback(() => {
    if (!recorder.current) return 0;
    return recorder.current.getCurrentDuration();
  }, []);

  // Wrapper for setSelectedDeviceId to include logging
  const wrappedSetSelectedDeviceId = useCallback((deviceId: string | null) => {
    console.log('[useRecordingHook] Setting selected device ID:', deviceId);
    setSelectedDeviceId(deviceId);
  }, [setSelectedDeviceId]);

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
    isSystemAudio,
    selectedDeviceId,
    lastAction,
    recordingAttemptsCount,
    deviceSelectionReady,
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
    isSystemAudio,
    selectedDeviceId,
    lastAction,
    recordingAttemptsCount,
    deviceSelectionReady,
    audioFileSize,
    
    // Actions
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    setIsSystemAudio: handleSystemAudioChange,
    audioDevices, // Now correctly returns AudioDevice[] instead of MediaDeviceInfo[]
    getCurrentDuration,
    initError: deviceContext.initError,
    refreshDevices: deviceContext.refreshDevices,
    setSelectedDeviceId: wrappedSetSelectedDeviceId,
    devicesLoading: deviceContext.devicesLoading,
    permissionState: deviceContext.permissionState,
    isRestrictedRoute
  };
}
