
import { useEffect, useCallback } from "react";
import { useRecordingState } from "./recording/useRecordingState";
import { useRecordingLifecycle } from "./recording/useRecordingLifecycle";
import { useDeviceSelection } from "./recording/useDeviceSelection";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();

  const {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    deviceSelectionReady
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
  }, [initializeRecorder]);

  const handleStartRecording = useCallback(async () => {
    console.log('[useRecording] Starting recording with device ID:', selectedDeviceId, 'Ready:', deviceSelectionReady);
    
    if (!selectedDeviceId) {
      console.error('[useRecording] No device selected for recording');
      toast({
        title: "Error",
        description: "Select a microphone before starting the recording.",
        variant: "destructive",
      });
      return;
    }
    
    if (!deviceSelectionReady) {
      console.error('[useRecording] Device selection not ready');
      toast({
        title: "Error",
        description: "Please wait, microphone initialization in progress.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await startRecording(selectedDeviceId);
    } catch (error) {
      console.error('[useRecording] Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Check browser permissions.",
        variant: "destructive",
      });
    }
  }, [selectedDeviceId, deviceSelectionReady, startRecording, toast]);

  const handleStopRecording = useCallback(async () => {
    console.log('[useRecording] Stopping recording');
    try {
      return await stopRecording();
    } catch (error) {
      console.error('[useRecording] Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to finalize recording.",
        variant: "destructive",
      });
      return { blob: null, duration: 0 };
    }
  }, [stopRecording, toast]);

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
    deviceSelectionReady,
    getCurrentDuration
  };
};
