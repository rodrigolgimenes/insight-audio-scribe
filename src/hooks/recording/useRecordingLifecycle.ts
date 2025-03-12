
import { useRef, useCallback, useState, useEffect } from "react";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
import { RecordingLogger } from "@/utils/audio/recordingLogger";
import { useRecordingState } from "./useRecordingState";
import { useRecorderInit } from "./lifecycle/useRecorderInit";
import { useStartRecording } from "./lifecycle/useStartRecording";
import { useStopRecording } from "./lifecycle/useStopRecording";
import { usePauseResumeRecording } from "./lifecycle/usePauseResumeRecording";
import { useSaveDeleteRecording } from "./lifecycle/useSaveDeleteRecording";
import { StreamManager } from "@/utils/audio/helpers/streamManager";
import { useToast } from "@/hooks/use-toast";

export const useRecordingLifecycle = () => {
  const recordingState = useRecordingState();
  const { toast } = useToast();
  const [lastError, setLastError] = useState<string | null>(null);
  
  const audioRecorder = useRef(new AudioRecorder());
  const logger = useRef(new RecordingLogger());
  const isProcessing = useRef(false);
  const streamManager = useRef(new StreamManager());

  // Initialize recorder
  const { initializeRecorder, getCurrentDuration } = useRecorderInit(
    audioRecorder, 
    logger
  );

  // Start recording
  const handleStartRecording = useStartRecording(recordingState);

  // Stop recording
  const handleStopRecording = useStopRecording(recordingState, audioRecorder);

  // Pause and resume recording
  const { handlePauseRecording, handleResumeRecording } = usePauseResumeRecording(
    recordingState, 
    audioRecorder
  );

  // Save and delete recordings
  const { handleDelete, handleSaveRecording } = useSaveDeleteRecording(
    recordingState, 
    audioRecorder, 
    handleStopRecording
  );

  // Log errors for debugging
  useEffect(() => {
    if (lastError) {
      console.error('[useRecordingLifecycle] Last error:', lastError);
    }
  }, [lastError]);

  // Modified start recording function to properly handle stream initialization
  const wrappedStartRecording = useCallback((selectedDeviceId: string | null) => {
    console.log('[useRecordingLifecycle] Starting recording with device ID:', selectedDeviceId);
    
    if (isProcessing.current) {
      console.log('[useRecordingLifecycle] Already processing a recording action, ignoring');
      setLastError('Already processing a recording action');
      toast({
        title: "Processing",
        description: "Already processing a recording action, please wait...",
        variant: "default",
      });
      return;
    }
    
    if (!selectedDeviceId) {
      console.error('[useRecordingLifecycle] No device ID provided, cannot start recording');
      setLastError('No device ID provided');
      toast({
        title: "Error",
        description: "No microphone selected. Please select a microphone first.",
        variant: "destructive",
      });
      return;
    }
    
    isProcessing.current = true;
    
    // Log that we're about to start the process
    console.log('[useRecordingLifecycle] Attempting to get audio stream...');
    
    // First get the stream from the microphone (and system if needed)
    handleStartRecording(selectedDeviceId)
      .then(stream => {
        if (!stream) {
          console.error('[useRecordingLifecycle] Failed to get audio stream');
          isProcessing.current = false;
          setLastError('Failed to get audio stream');
          return;
        }
        
        // Verify we have audio tracks
        const audioTracks = stream.getAudioTracks();
        console.log('[useRecordingLifecycle] Got stream with audio tracks:', audioTracks.length);
        
        if (audioTracks.length === 0) {
          console.error('[useRecordingLifecycle] No audio tracks in stream');
          isProcessing.current = false;
          setLastError('No audio tracks in stream');
          toast({
            title: "Error",
            description: "No audio tracks detected in the stream. Please try a different microphone.",
            variant: "destructive",
          });
          return;
        }
        
        // Log track details
        audioTracks.forEach((track, i) => {
          console.log(`[useRecordingLifecycle] Audio track ${i}:`, {
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            settings: track.getSettings()
          });
        });
        
        // Initialize stream manager for cleanup
        streamManager.current.initialize(stream, () => {
          // Handle stream inactive event
          console.log('[useRecordingLifecycle] Stream became inactive, stopping recording');
          if (recordingState.isRecording && !isProcessing.current) {
            handleStopRecording().catch(err => {
              console.error('[useRecordingLifecycle] Error stopping recording on inactive stream:', err);
              setLastError('Error stopping recording on inactive stream: ' + err.message);
            });
          }
        });
        
        // Start the actual recording with the obtained stream
        console.log('[useRecordingLifecycle] Starting recorder with stream...');
        audioRecorder.current.startRecording(stream)
          .then(() => {
            recordingState.setIsRecording(true);
            recordingState.setIsPaused(false);
            console.log('[useRecordingLifecycle] Recording started successfully');
            isProcessing.current = false;
            setLastError(null);
          })
          .catch(err => {
            console.error('[useRecordingLifecycle] Error starting recorder:', err);
            streamManager.current.cleanup();
            isProcessing.current = false;
            setLastError('Error starting recorder: ' + err.message);
            toast({
              title: "Error",
              description: "Failed to start recording: " + (err.message || "Unknown error"),
              variant: "destructive",
            });
          });
      })
      .catch(error => {
        console.error('[useRecordingLifecycle] Error getting audio stream:', error);
        recordingState.setIsRecording(false);
        isProcessing.current = false;
        setLastError('Error getting audio stream: ' + error.message);
        toast({
          title: "Error",
          description: "Failed to access microphone: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
      });
  }, [handleStartRecording, handleStopRecording, recordingState, toast]);

  return {
    initializeRecorder,
    handleStartRecording: wrappedStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    getCurrentDuration,
    lastError
  };
};
