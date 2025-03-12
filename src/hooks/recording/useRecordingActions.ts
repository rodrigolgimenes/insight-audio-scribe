
import { RecordingStateType } from "./useRecordingState";
import { useStartRecordingAction } from "./actions/useStartRecordingAction";
import { useStopRecordingAction } from "./actions/useStopRecordingAction";
import { usePauseRecordingAction } from "./actions/usePauseRecordingAction";
import { useResumeRecordingAction } from "./actions/useResumeRecordingAction";

type RecordingLifecycle = {
  startRecording: (deviceId: string | null, isSystemAudio: boolean) => Promise<boolean>;
  stopRecording: () => Promise<{ blob: Blob | null; duration: number } | undefined>;
  pauseRecording: () => void;
  resumeRecording: () => void;
};

/**
 * Hook for providing high-level recording action handlers
 */
export const useRecordingActions = (
  recordingState: RecordingStateType,
  startRecording: RecordingLifecycle["startRecording"],
  stopRecording: RecordingLifecycle["stopRecording"],
  pauseRecording: RecordingLifecycle["pauseRecording"],
  resumeRecording: RecordingLifecycle["resumeRecording"]
) => {
  const {
    isRecording,
    isPaused,
    setIsRecording,
    setIsPaused,
    isSystemAudio,
    selectedDeviceId,
    setLastAction
  } = recordingState;

  // Use specialized hooks for each recording action
  const handleStartRecording = useStartRecordingAction(
    isRecording,
    selectedDeviceId,
    isSystemAudio,
    startRecording,
    setIsRecording,
    setIsPaused,
    setLastAction
  );

  const handleStopRecording = useStopRecordingAction(
    isRecording,
    stopRecording,
    setIsRecording,
    setIsPaused,
    setLastAction
  );

  const handlePauseRecording = usePauseRecordingAction(
    isRecording,
    isPaused,
    pauseRecording,
    setIsPaused,
    setLastAction
  );

  const handleResumeRecording = useResumeRecordingAction(
    isRecording,
    isPaused,
    resumeRecording,
    setIsPaused,
    setLastAction
  );

  return {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  };
};
