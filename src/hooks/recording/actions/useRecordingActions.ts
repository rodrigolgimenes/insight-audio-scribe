
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";
import { AudioRecorder } from "@/utils/audio/audioRecorder";

export const useRecordingActions = (
  recorder: React.RefObject<AudioRecorder | null>,
  recordingState: RecordingStateType,
  startMicrophoneCapture: () => Promise<boolean>,
  startSystemAudioCapture: () => Promise<boolean>,
  stopMicrophoneCapture: () => void,
  stopSystemAudioCapture: () => void,
  pauseRecording: () => void,
  resumeRecording: () => void
) => {
  const handleStartRecording = useCallback(async () => {
    console.log('[useRecordingActions] Starting recording');
    try {
      const micSuccess = await startMicrophoneCapture();
      if (!micSuccess) {
        throw new Error("Failed to start microphone capture");
      }
      
      if (recordingState.isSystemAudio) {
        const systemSuccess = await startSystemAudioCapture();
        if (!systemSuccess) {
          stopMicrophoneCapture();
          throw new Error("Failed to start system audio capture");
        }
      }
      
      recordingState.setIsRecording(true);
      return true;
    } catch (error) {
      console.error('[useRecordingActions] Error starting recording:', error);
      return false;
    }
  }, [
    startMicrophoneCapture, 
    startSystemAudioCapture, 
    stopMicrophoneCapture, 
    recordingState
  ]);
  
  const handleStopRecording = useCallback(async () => {
    console.log('[useRecordingActions] Stopping recording');
    stopMicrophoneCapture();
    if (recordingState.isSystemAudio) {
      stopSystemAudioCapture();
    }
    recordingState.setIsRecording(false);
    recordingState.setIsPaused(false);
    
    return { blob: new Blob(), duration: 0 };
  }, [
    stopMicrophoneCapture, 
    stopSystemAudioCapture, 
    recordingState
  ]);
  
  const handlePauseRecording = useCallback(() => {
    console.log('[useRecordingActions] Pausing recording');
    pauseRecording();
    recordingState.setIsPaused(true);
  }, [pauseRecording, recordingState]);
  
  const handleResumeRecording = useCallback(() => {
    console.log('[useRecordingActions] Resuming recording');
    resumeRecording();
    recordingState.setIsPaused(false);
  }, [resumeRecording, recordingState]);
  
  return {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  };
};
