
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface TranscriptionStatusProps {
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
}: TranscriptionStatusProps) => {
  const [transcriptionTimeout, setTranscriptionTimeout] = useState(false);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<string | null>(null);
  
  // Calculate duration in minutes for display
  const durationInMinutes = duration ? Math.round(duration / 1000 / 60) : 0;
  
  // Determine if it's a long recording (over 10 minutes)
  const isLongAudio = durationInMinutes > 10;
  
  // Very long audio (over 30 minutes) might need special handling
  const isVeryLongAudio = durationInMinutes > 30;
  
  // Check for inconsistent state - transcript exists but status is still processing
  const hasInconsistentState = (transcript && transcript.trim() !== '' && 
    (status === 'processing' || status === 'transcribing' || status === 'generating_minutes'));
  
  // Determine when to show retry button
  const showRetryButton = status === 'error' || transcriptionTimeout || hasInconsistentState;
  
  // When to show progress indicators
  const showProgress = ['pending', 'processing', 'transcribing', 'generating_minutes', 'awaiting_transcription'].includes(status);

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
