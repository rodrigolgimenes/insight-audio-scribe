
import { useCallback } from "react";
import { RecordingStateType } from "./useRecordingState";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
import { useStartRecording } from "./lifecycle/useStartRecording";
import { useStopRecording } from "./lifecycle/useStopRecording";
import { usePauseResumeRecording } from "./lifecycle/usePauseResumeRecording";

/**
 * Hook that manages the lifecycle of a recording session
 */
export const useRecordingLifecycle = (
  recorder: React.RefObject<AudioRecorder>,
  recordingState: RecordingStateType
) => {
  // Use specialized hooks for each recording action
  const { startRecording } = useStartRecording(recorder, recordingState);
  const { stopRecording } = useStopRecording(recorder, recordingState);
  const { pauseRecording, resumeRecording } = usePauseResumeRecording(recorder);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
};
