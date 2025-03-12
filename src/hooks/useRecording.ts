
import { useEffect, useCallback, useState } from "react";
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
  const [initError, setInitError] = useState<Error | null>(null);
  const [recordingAttemptsCount, setRecordingAttemptsCount] = useState(0);

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

  // Clear any initialization errors when device selection changes
  useEffect(() => {
    if (selectedDeviceId) {
      setInitError(null);
    }
  }, [selectedDeviceId]);

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
  }, [initializeRecorder]);

  const handleStartRecording = useCallback(() => {
    console.log('[useRecording] Starting recording with device ID:', selectedDeviceId);
    
    // Increment the attempts counter for troubleshooting
    setRecordingAttemptsCount(prev => prev + 1);
    
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
      console.warn('[useRecording] Device selection not ready, but continuing anyway');
    }
    
    try {
      console.log('[useRecording] Calling startRecording with device ID:', selectedDeviceId);
      startRecording(selectedDeviceId);
      console.log('[useRecording] startRecording function called successfully');
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

  // Log state changes for debugging
  useEffect(() => {
    console.log('[useRecording] State updated:', { 
      isRecording, 
      isPaused, 
      audioUrl: audioUrl ? 'exists' : 'null',
      mediaStream: mediaStream ? 'exists' : 'null',
      selectedDeviceId,
      deviceSelectionReady,
      recordingAttemptsCount
    });
  }, [isRecording, isPaused, audioUrl, mediaStream, selectedDeviceId, deviceSelectionReady, recordingAttemptsCount]);

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
    getCurrentDuration,
    initError,
    recordingAttemptsCount
  };
};
