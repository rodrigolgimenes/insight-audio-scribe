
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusHeader } from "./StatusHeader";
import { TranscriptionAlert } from "./TranscriptionAlert";
import { ActionButtons } from "./ActionButtons";
import { getStatusInfo } from "./getStatusInfo";
import { LongRecordingNotice } from "./LongRecordingNotice";
import { StallDetection } from "./StallDetection";
import { ProgressDisplay } from "./ProgressDisplay";
import { useTranscriptionActions } from "@/hooks/notes/useTranscriptionActions";

interface TranscriptionStatusProps {
  status: string;
  progress: number;
  error?: string;
  duration?: number;
  noteId?: string;
  transcript?: string | null;
}

export const TranscriptionStatus = ({
  status,
  progress,
  error,
  duration,
  noteId,
  transcript
}: TranscriptionStatusProps) => {
  const [transcriptionTimeout, setTranscriptionTimeout] = useState(false);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<Date | null>(null);
  
  const { isRetrying, isSyncing, handleRetry, handleSyncStatus } = useTranscriptionActions(noteId);
  
  // Convert milliseconds to minutes
  const durationInMinutes = duration && Math.round(duration / 1000 / 60);
  const isLongAudio = Boolean(durationInMinutes && durationInMinutes > 30);
  const isVeryLongAudio = Boolean(durationInMinutes && durationInMinutes > 60);
  
  const statusInfo = getStatusInfo(status);
  
  // Detect inconsistent state - completed generating minutes but status still shows transcribing
  const hasInconsistentState = Boolean((status === 'transcribing' || status === 'processing') && transcript);

  // Show retry button for errors, pending status, or stalled transcriptions
  const showRetryButton = Boolean(status === 'error' || status === 'pending' || transcriptionTimeout) && Boolean(noteId);
  const showProgress = status !== 'completed' && status !== 'error' && progress > 0;
  
  return (
    <Card className="p-4 mb-4 relative">
      <StatusHeader 
        icon={<StatusIcon status={status} />}
        message={statusInfo.message}
        color={statusInfo.color}
        isLongAudio={isLongAudio}
        durationInMinutes={durationInMinutes}
        status={status}
        progress={progress}
      />
      
      {/* Stall detection (non-visual component) */}
      <StallDetection 
        status={status}
        noteId={noteId}
        onStallDetected={setTranscriptionTimeout}
        onLastProgressUpdate={setLastProgressUpdate}
      />
      
      {/* Display alert for inconsistent state */}
      {hasInconsistentState && (
        <TranscriptionAlert 
          type="warning"
          title="Status inconsistency detected"
          message="The transcript exists but the status shows as processing. Click 'Sync Status' to fix this."
        />
      )}
      
      {/* Alert for stalled transcription */}
      {transcriptionTimeout && (
        <TranscriptionAlert 
          type="warning"
          title="Transcription may be stalled"
          message="No progress updates for more than 5 minutes. You can try restarting the transcription process."
        />
      )}
      
      {/* Warning for very long audio */}
      {isVeryLongAudio && status !== 'error' && (
        <LongRecordingNotice durationInMinutes={durationInMinutes} />
      )}
      
      {/* Error display */}
      {status === 'error' && (
        <TranscriptionAlert 
          type="error"
          title="Processing error"
          message={error || "An unknown error occurred during transcription"}
          noteId={noteId}
        />
      )}
      
      {/* Action buttons */}
      <ActionButtons 
        showRetryButton={showRetryButton}
        hasInconsistentState={hasInconsistentState}
        onRetry={handleRetry}
        onSyncStatus={handleSyncStatus}
        isRetrying={isRetrying}
        isSyncing={isSyncing}
      />
      
      {/* Progress bar and last activity */}
      <ProgressDisplay
        showProgress={showProgress}
        progress={progress}
        lastProgressUpdate={lastProgressUpdate}
        status={status}
      />
    </Card>
  );
};

import { StatusIcon } from "./StatusIcon";
