
import { useCallback } from "react";
import { RecordingLogger } from "@/utils/audio/recordingLogger";
import { AudioRecorder } from "@/utils/audio/audioRecorder";

export function useRecorderInit(
  recorder: React.RefObject<AudioRecorder>,
  logger: React.RefObject<RecordingLogger>
) {
  const initializeRecorder = useCallback(() => {
    console.log('[useRecorderInit] Initializing recorder');
    
    if (recorder.current && logger.current) {
      recorder.current.addObserver(logger.current);
      return () => {
        if (recorder.current && logger.current) {
          recorder.current.removeObserver(logger.current);
        }
      };
    }
    
    return () => {};
  }, [recorder, logger]);

  const getCurrentDuration = useCallback(() => {
    return recorder.current?.getCurrentDuration() || 0;
  }, [recorder]);

  return { initializeRecorder, getCurrentDuration };
}
