
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";
import { AudioRecorder } from "@/utils/audio/audioRecorder";

export const useMicrophoneCapture = (
  recorder: React.RefObject<AudioRecorder | null>,
  recordingState: RecordingStateType
) => {
  const { selectedDeviceId, setSelectedDeviceId } = recordingState;
  
  const startMicrophoneCapture = useCallback(async () => {
    console.log('[useMicrophoneCapture] Starting microphone capture');
    return true;
  }, []);
  
  const stopMicrophoneCapture = useCallback(() => {
    console.log('[useMicrophoneCapture] Stopping microphone capture');
  }, []);
  
  return {
    selectedDeviceId,
    setSelectedDeviceId,
    startMicrophoneCapture,
    stopMicrophoneCapture
  };
};
