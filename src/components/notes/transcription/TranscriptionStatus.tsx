
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusHeader } from "./StatusHeader";
import { TranscriptionAlert } from "./TranscriptionAlert";
import { ActionButtons } from "./ActionButtons";
import { getStatusInfo } from "./getStatusInfo";
import { LongRecordingNotice } from "./LongRecordingNotice";

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
  const isLongAudio = durationInMinutes && durationInMinutes > 30;
  const isVeryLongAudio = durationInMinutes && durationInMinutes > 60;
  
  const statusInfo = getStatusInfo(status);
  
  // Detect inconsistent state - completed generating minutes but status still shows transcribing
  const hasInconsistentState = (status === 'transcribing' || status === 'processing') && transcript;
  
  // Check for stalled transcription
  useEffect(() => {
    if (status === 'processing' || status === 'transcribing' || status === 'pending') {
      // Start a timer to detect stalled transcriptions
      const checkTimeoutId = setTimeout(() => {
        if (!noteId) return;
        
        // Check if the note's status has been updated
        const checkStatus = async () => {
          console.log('Checking note status for inactivity...');
          const { data } = await supabase
            .from('notes')
            .select('updated_at, processing_progress, status')
            .eq('id', noteId)
            .single();
            
          if (data) {
            const lastUpdate = new Date(data.updated_at);
            const now = new Date();
            const timeSinceUpdate = now.getTime() - lastUpdate.getTime();
            
            // If no update for 5 minutes (300000ms) and still in processing state
            if (timeSinceUpdate > 300000) {
              console.log('Transcription seems stalled (no updates for 5+ minutes)');
              setTranscriptionTimeout(true);
            } else {
              setLastProgressUpdate(lastUpdate);
              console.log('Transcription still active, last update:', 
                Math.round(timeSinceUpdate / 1000 / 60), 'minutes ago');
            }
          }
        };
        
        checkStatus();
      }, 300000); // Check after 5 minutes
      
      return () => clearTimeout(checkTimeoutId);
    } else {
      setTranscriptionTimeout(false);
    }
  }, [status, noteId]);
  
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
        icon={statusInfo.icon}
        message={statusInfo.message}
        color={statusInfo.color}
        isLongAudio={!!isLongAudio}
        durationInMinutes={durationInMinutes}
        status={status}
        progress={progress}
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
      
      {/* Progress bar */}
      {showProgress && (
        <Progress value={progress} className="w-full mt-3" />
      )}
      
      {/* Last activity timestamp */}
      {lastProgressUpdate && status !== 'completed' && status !== 'error' && (
        <div className="mt-2 text-xs text-gray-500">
          Last activity: {new Date(lastProgressUpdate).toLocaleTimeString()}
        </div>
      )}
    </Card>
  );
};
