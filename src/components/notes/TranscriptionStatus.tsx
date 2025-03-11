
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { getStatusInfo } from "./transcription/getStatusInfo";
import { TranscriptError } from "./TranscriptError";
import { RetryButton } from "./transcription/RetryButton";
import { StatusHeader } from "./transcription/StatusHeader";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
  const { message, icon, color } = statusInfo;
  
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
  const showRetryButton = (status === 'error' || status === 'pending' || transcriptionTimeout) && noteId;
  const showProgress = status !== 'completed' && status !== 'error' && progress > 0;
  
  return (
    <Card className="p-4 mb-4 relative">
      <StatusHeader 
        icon={icon}
        message={message}
        color={color}
        isLongAudio={!!isLongAudio}
        durationInMinutes={durationInMinutes}
        status={status}
        progress={progress}
      />
      
      {hasInconsistentState && (
        <div className="mt-2 mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-700 font-medium">Status inconsistency detected</p>
            <p className="text-sm text-amber-600">The transcript exists but the status shows as "{status}". Click "Sync Status" to fix this.</p>
          </div>
        </div>
      )}
      
      {transcriptionTimeout && (
        <div className="mt-2 mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-700 font-medium">Transcription may be stalled</p>
            <p className="text-sm text-amber-600">No progress updates for more than 5 minutes. You can try restarting the transcription process.</p>
          </div>
        </div>
      )}
      
      {isVeryLongAudio && status !== 'error' && (
        <div className="mt-2 text-amber-600 text-sm">
          <p>This is a very long recording ({durationInMinutes} minutes). Processing may take additional time.</p>
          {durationInMinutes > 90 && (
            <p className="mt-1">For recordings over 90 minutes, consider splitting into smaller segments for faster processing.</p>
          )}
        </div>
      )}
      
      {status === 'error' && <TranscriptError error={error} noteId={noteId} />}
      
      <div className="mt-3 flex flex-wrap gap-2">
        {showRetryButton && (
          <Button
            variant="outline"
            className="bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700 flex justify-center items-center gap-2"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry Transcription'}</span>
          </Button>
        )}
        
        {hasInconsistentState && (
          <Button
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700 flex justify-center items-center gap-2"
            onClick={handleSyncStatus}
            disabled={isSyncing}
          >
            <CheckCircle className="h-4 w-4" />
            <span>{isSyncing ? 'Syncing...' : 'Sync Status'}</span>
          </Button>
        )}
      </div>
      
      {showProgress && (
        <Progress value={progress} className="w-full mt-3" />
      )}
      
      {lastProgressUpdate && status !== 'completed' && status !== 'error' && (
        <div className="mt-2 text-xs text-gray-500">
          Last activity: {new Date(lastProgressUpdate).toLocaleTimeString()}
        </div>
      )}
    </Card>
  );
};
