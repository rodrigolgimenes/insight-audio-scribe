
import { useEffect } from "react";
import { useRecordingState } from "./recording/useRecordingState";
import { useRecordingLifecycle } from "./recording/useRecordingLifecycle";
import { useDeviceSelection } from "./recording/useDeviceSelection";

export const useRecording = () => {
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
  } = useRecordingState();

  const {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId
  } = useDeviceSelection();

  const {
    initializeRecorder,
    handleStartRecording: startRecording,
    handleStopRecording: stopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    getCurrentDuration
  } = useRecordingLifecycle();

  useEffect(() => {
    const cleanup = initializeRecorder();
    return cleanup;
  }, []);

  const handleStartRecording = async () => {
    console.log('[useRecording] Starting recording with device ID:', selectedDeviceId);
    if (!selectedDeviceId) {
      console.error('[useRecording] No device selected for recording');
      return;
    }
    await startRecording(selectedDeviceId);
  };

  const handleStopRecording = async () => {
    console.log('[useRecording] Stopping recording');
    return await stopRecording();
  };

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
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    getCurrentDuration
  };
};
