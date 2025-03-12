
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";
import { AudioRecorder } from "@/utils/audio/audioRecorder";

export function usePauseResumeRecording(
  recordingState: Pick<RecordingStateType, "setIsPaused">,
  recorder: React.RefObject<AudioRecorder>
) {
  const handlePauseRecording = useCallback(() => {
    console.log('[usePauseResumeRecording] Pausing recording');
    try {
      if (recorder.current) {
        recorder.current.pauseRecording();
        recordingState.setIsPaused(true);
      }
    } catch (error) {
      console.error('[usePauseResumeRecording] Error pausing recording:', error);
    }
  }, [recorder, recordingState]);

  const handleResumeRecording = useCallback(() => {
    console.log('[usePauseResumeRecording] Resuming recording');
    try {
      if (recorder.current) {
        recorder.current.resumeRecording();
        recordingState.setIsPaused(false);
      }
    } catch (error) {
      console.error('[usePauseResumeRecording] Error resuming recording:', error);
    }
  }, [recorder, recordingState]);

  return { handlePauseRecording, handleResumeRecording };
}
