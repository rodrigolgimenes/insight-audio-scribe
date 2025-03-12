
import { useEffect } from "react";

/**
 * Hook to track recording attempts
 */
export const useRecordingAttemptTracker = (
  isRecording: boolean,
  setRecordingAttemptsCount: (count: number | ((prev: number) => number)) => void
) => {
  // Increment recording attempts count before starting
  useEffect(() => {
    if (isRecording) {
      setRecordingAttemptsCount(prev => prev + 1);
    }
  }, [isRecording, setRecordingAttemptsCount]);
};
