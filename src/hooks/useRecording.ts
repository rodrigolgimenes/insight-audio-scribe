
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
  const [lastAction, setLastAction] = useState<{action: string, timestamp: number, success: boolean} | null>(null);

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
      console.log('[useRecording] Device selected, cleared init error');
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

  // Handle system audio toggle
  const handleSystemAudioChange = useCallback((enabled: boolean) => {
    console.log('[useRecording] System audio setting changed to:', enabled);
    setIsSystemAudio(enabled);
    setLastAction({
      action: `Sistema de áudio ${enabled ? 'ativado' : 'desativado'}`,
      timestamp: Date.now(),
      success: true
    });
  }, [setIsSystemAudio]);

  const handleStartRecording = useCallback(() => {
    console.log('[useRecording] Starting recording with device ID:', selectedDeviceId);
    
    // Increment attempts counter for debugging
    setRecordingAttemptsCount(prev => prev + 1);
    
    // Set start action record
    setLastAction({
      action: 'Iniciar gravação',
      timestamp: Date.now(),
      success: false // Will be updated if successful
    });
    
    if (!selectedDeviceId) {
      console.error('[useRecording] No device selected');
      toast({
        title: "Error",
        description: "Select a microphone before starting the recording.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      startRecording(selectedDeviceId);
      
      // Update the action record if we get this far without errors
      setTimeout(() => {
        if (isRecording) {
          setLastAction(prev => prev ? {...prev, success: true} : null);
        }
      }, 500);
    } catch (error) {
      console.error('[useRecording] Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Check browser permissions.",
        variant: "destructive",
      });
    }
  }, [selectedDeviceId, startRecording, toast, isRecording]);

  const handleStopRecording = useCallback(async () => {
    console.log('[useRecording] Stopping recording');
    setLastAction({
      action: 'Parar gravação',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      const result = await stopRecording();
      setLastAction(prev => prev ? {...prev, success: true} : null);
      return result;
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
