
import { useState } from "react";

interface UseTranscriptionStatusProps {
  status: string;
  progress: number;
  duration?: number;
  transcript?: string | null;
}

export const useTranscriptionStatus = ({
  status,
  progress,
  duration,
  transcript
}: UseTranscriptionStatusProps) => {
  const [transcriptionTimeout, setTranscriptionTimeout] = useState(false);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<Date | null>(null);
  
  // Convert milliseconds to minutes
  const durationInMinutes = duration && Math.round(duration / 1000 / 60);
  
  // Audio length categories
  const isLongAudio = Boolean(durationInMinutes && durationInMinutes > 30);
  const isVeryLongAudio = Boolean(durationInMinutes && durationInMinutes > 60);
  
  // Detect inconsistent state - completed generating minutes but status still shows transcribing
  const hasInconsistentState = Boolean(
    (status === 'transcribing' || status === 'processing') && transcript
  );

  // Show retry button for errors, pending status, or stalled transcriptions
  const showRetryButton = Boolean(
    status === 'error' || status === 'pending' || transcriptionTimeout
  );
  
  // Show progress bar for in-progress statuses
  const showProgress = status !== 'completed' && status !== 'error' && progress > 0;
  
  return {
    transcriptionTimeout,
    setTranscriptionTimeout,
    lastProgressUpdate,
    setLastProgressUpdate,
    durationInMinutes,
    isLongAudio,
    isVeryLongAudio,
    hasInconsistentState,
    showRetryButton,
    showProgress
  };
};
