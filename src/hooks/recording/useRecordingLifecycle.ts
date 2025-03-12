
import { useRef } from "react";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
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
  const wrappedStartRecording = async (selectedDeviceId: string | null) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    
    try {
      const stream = await handleStartRecording(selectedDeviceId);
      
      if (!stream) {
        console.error('[useRecordingLifecycle] Failed to get stream from handleStartRecording');
        isProcessing.current = false;
        return;
      }
      
      console.log('[useRecordingLifecycle] Starting audio recorder with stream');
      await audioRecorder.current.startRecording(stream);
      recordingState.setIsRecording(true);
      recordingState.setIsPaused(false);
      
      stream.addEventListener('inactive', () => {
        console.log('[useRecordingLifecycle] Stream became inactive');
        if (!isProcessing.current) {
          handleStopRecording();
        }
      });
    } catch (error) {
      console.error('[useRecordingLifecycle] Error in wrappedStartRecording:', error);
    } finally {
      isProcessing.current = false;
    }
  };

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
