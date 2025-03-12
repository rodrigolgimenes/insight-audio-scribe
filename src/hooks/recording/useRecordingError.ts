
import { useState } from "react";

export const useRecordingError = () => {
  const [initError, setInitError] = useState<Error | null>(null);
  const [recordingAttemptsCount, setRecordingAttemptsCount] = useState(0);
  const [lastAction, setLastAction] = useState<{
    action: string;
    timestamp: number;
    success: boolean;
    error?: string;
  } | null>(null);

  return {
    initError,
    setInitError,
    recordingAttemptsCount,
    setRecordingAttemptsCount,
    lastAction,
    setLastAction
  };
};
