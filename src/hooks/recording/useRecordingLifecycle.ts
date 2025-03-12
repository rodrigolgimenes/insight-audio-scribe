
import { useRef, useCallback } from "react";
import { AudioRecorder } from "@/utils/audio/AudioRecorder";
import { RecordingLogger } from "@/utils/audio/recordingLogger";
import { useRecordingState } from "./useRecordingState";
import { useRecorderInit } from "./lifecycle/useRecorderInit";
import { useStartRecording } from "./lifecycle/useStartRecording";
import { useStopRecording } from "./lifecycle/useStopRecording";
import { usePauseResumeRecording } from "./lifecycle/usePauseResumeRecording";
import { useSaveDeleteRecording } from "./lifecycle/useSaveDeleteRecording";

export const useRecordingLifecycle = () => {
  const recordingState = useRecordingState();
  
  const audioRecorder = useRef(new AudioRecorder());
  const logger = useRef(new RecordingLogger());
  const isProcessing = useRef(false);

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

  // Modified start recording to initialize the recorder after getting the stream
  const wrappedStartRecording = useCallback((selectedDeviceId: string | null) => {
    console.log('[useRecordingLifecycle] wrappedStartRecording called with device ID:', selectedDeviceId);
    
    if (isProcessing.current) {
      console.log('[useRecordingLifecycle] Already processing a recording action, ignoring');
      return;
    }
    
    if (!selectedDeviceId) {
      console.error('[useRecordingLifecycle] No device ID provided');
      return;
    }
    
    isProcessing.current = true;
    
    try {
      console.log('[useRecordingLifecycle] Starting recording with device ID:', selectedDeviceId);
      
      // First get the stream - using Promise.then instead of async/await to avoid potential issues
      handleStartRecording(selectedDeviceId)
        .then(stream => {
          if (!stream) {
            console.error('[useRecordingLifecycle] Failed to get stream from handleStartRecording');
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
          
          console.log('[useRecordingLifecycle] Starting audio recorder with stream:', {
            streamId: stream.id,
            audioTracks: audioTracks.length,
            track0Label: audioTracks[0]?.label || 'unknown'
          });
          
          // Then start recording with the obtained stream
          audioRecorder.current.startRecording(stream)
            .then(() => {
              recordingState.setIsRecording(true);
              recordingState.setIsPaused(false);
              console.log('[useRecordingLifecycle] Recording started successfully');
            })
            .catch(err => {
              console.error('[useRecordingLifecycle] Error starting recorder:', err);
            })
            .finally(() => {
              isProcessing.current = false;
            });
          
          // Add inactive event listener to handle unexpected stream end
          stream.addEventListener('inactive', () => {
            console.log('[useRecordingLifecycle] Stream became inactive');
            if (recordingState.isRecording && !isProcessing.current) {
              handleStopRecording().catch(err => {
                console.error('[useRecordingLifecycle] Error stopping recording on inactive stream:', err);
              });
            }
          });
        })
        .catch(error => {
          console.error('[useRecordingLifecycle] Error getting stream:', error);
          recordingState.setIsRecording(false); // Make sure to reset state on error
          isProcessing.current = false;
        });
    } catch (error) {
      console.error('[useRecordingLifecycle] Error in wrappedStartRecording:', error);
      recordingState.setIsRecording(false); // Make sure to reset state on error
      isProcessing.current = false;
    }
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
