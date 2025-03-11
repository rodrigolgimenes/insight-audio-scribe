
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { StatusHeader } from "./StatusHeader";
import { TranscriptionAlert } from "./TranscriptionAlert";
import { ActionButtons } from "./ActionButtons";
import { getStatusInfo } from "./getStatusInfo";
import { LongRecordingNotice } from "./LongRecordingNotice";
import { StallDetection } from "./StallDetection";
import { ProgressDisplay } from "./ProgressDisplay";
import { StatusIcon } from "./StatusIcon";
import { supabase } from "@/integrations/supabase/client";

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
  const { retryTranscription } = useNoteTranscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [transcriptionTimeout, setTranscriptionTimeout] = useState(false);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<Date | null>(null);
  
  // Convert milliseconds to minutes
  const durationInMinutes = duration && Math.round(duration / 1000 / 60);
  const isLongAudio = Boolean(durationInMinutes && durationInMinutes > 30);
  const isVeryLongAudio = Boolean(durationInMinutes && durationInMinutes > 60);
  
  const statusInfo = getStatusInfo(status);
  
  // Detect inconsistent state - completed generating minutes but status still shows transcribing
  const hasInconsistentState = Boolean((status === 'transcribing' || status === 'processing') && transcript);
  
  const handleRetry = async () => {
    if (!noteId) return;
    
    setIsRetrying(true);
    setTranscriptionTimeout(false);
    
    try {
      const success = await retryTranscription(noteId);
      if (success) {
        toast({
          title: "Retry initiated",
          description: "Transcription process has been restarted.",
          variant: "default",
        });
      } else {
        throw new Error("Failed to restart transcription");
      }
    } catch (error) {
      console.error('Error retrying transcription:', error);
      toast({
        title: "Failed to retry",
        description: "Could not restart the transcription process. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };
  
  const handleSyncStatus = async () => {
    if (!noteId) return;
    
    setIsSyncing(true);
    try {
      // First check if the recording has a transcript
      const { data: note } = await supabase
        .from('notes')
        .select('recording_id, original_transcript')
        .eq('id', noteId)
        .single();
        
      if (!note?.recording_id) {
        throw new Error('Recording ID not found');
      }
      
      const { data: recording } = await supabase
        .from('recordings')
        .select('transcription, status')
        .eq('id', note.recording_id)
        .single();
        
      if (recording?.transcription && (!note.original_transcript || note.original_transcript.trim() === '')) {
        // If recording has transcription but note doesn't, sync them
        await supabase
          .from('notes')
          .update({
            original_transcript: recording.transcription,
            status: 'completed',
            processing_progress: 100
          })
          .eq('id', noteId);
        
        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        toast({
          title: "Status synchronized",
          description: "Transcript and status have been successfully synchronized.",
        });
      } else if (hasInconsistentState) {
        // If note has transcript but inconsistent status, fix the status
        await supabase
          .from('notes')
          .update({
            status: 'completed',
            processing_progress: 100
          })
          .eq('id', noteId);
          
        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        toast({
          title: "Status fixed",
          description: "Note status has been updated to 'completed'.",
        });
      } else {
        toast({
          title: "No action needed",
          description: "Note and recording data are already in sync.",
        });
      }
    } catch (error) {
      console.error('Error syncing status:', error);
      toast({
        title: "Sync failed",
        description: "Failed to synchronize status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

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
