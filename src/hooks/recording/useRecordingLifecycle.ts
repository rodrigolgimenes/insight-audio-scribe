
import { useRef, useCallback } from "react";
import { AudioRecorder } from "@/utils/audio/AudioRecorder";
import { RecordingLogger } from "@/utils/audio/recordingLogger";
import { useRecordingState } from "./useRecordingState";
import { useRecorderInit } from "./lifecycle/useRecorderInit";
import { useStartRecording } from "./lifecycle/useStartRecording";
import { useStopRecording } from "./lifecycle/useStopRecording";
import { usePauseResumeRecording } from "./lifecycle/usePauseResumeRecording";
import { useSaveDeleteRecording } from "./lifecycle/useSaveDeleteRecording";
import { StreamManager } from "@/utils/audio/streamManager";

export const useRecordingLifecycle = () => {
  const recordingState = useRecordingState();
  
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

  // Modified start recording function to properly handle stream initialization
  const wrappedStartRecording = useCallback((selectedDeviceId: string | null) => {
    console.log('[useRecordingLifecycle] Starting recording with device ID:', selectedDeviceId);
    
    if (isProcessing.current) {
      console.log('[useRecordingLifecycle] Already processing a recording action, ignoring');
      return;
    }
    
    if (!selectedDeviceId) {
      console.error('[useRecordingLifecycle] No device ID provided, cannot start recording');
      return;
    }
    
    isProcessing.current = true;
    
    // First get the stream from the microphone (and system if needed)
    handleStartRecording(selectedDeviceId)
      .then(stream => {
        if (!stream) {
          console.error('[useRecordingLifecycle] Failed to get audio stream');
          isProcessing.current = false;
          return;
        }
        
        // Verify we have audio tracks
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.error('[useRecordingLifecycle] No audio tracks in stream');
          isProcessing.current = false;
          return;
        }
        
        console.log('[useRecordingLifecycle] Got audio stream with tracks:', audioTracks.length);
        
        // Initialize stream manager for cleanup
        streamManager.current.initialize(stream, () => {
          // Handle stream inactive event
          console.log('[useRecordingLifecycle] Stream became inactive, stopping recording');
          if (recordingState.isRecording && !isProcessing.current) {
            handleStopRecording().catch(err => {
              console.error('[useRecordingLifecycle] Error stopping recording on inactive stream:', err);
            });
          }
        });
        
        // Start the actual recording with the obtained stream
        audioRecorder.current.startRecording(stream)
          .then(() => {
            recordingState.setIsRecording(true);
            recordingState.setIsPaused(false);
            console.log('[useRecordingLifecycle] Recording started successfully');
          })
          .catch(err => {
            console.error('[useRecordingLifecycle] Error starting recorder:', err);
            streamManager.current.cleanup();
          })
          .finally(() => {
            isProcessing.current = false;
          });
      })
      .catch(error => {
        console.error('[useRecordingLifecycle] Error getting audio stream:', error);
        recordingState.setIsRecording(false);
        isProcessing.current = false;
      });
  }, [handleStartRecording, handleStopRecording, recordingState]);

  return {
    initializeRecorder,
    handleStartRecording: wrappedStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    getCurrentDuration
  };
};
