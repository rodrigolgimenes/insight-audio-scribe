
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNoteTranscription } from "./useNoteTranscription";

export const useTranscriptionActions = (noteId?: string) => {
  const { retryTranscription } = useNoteTranscription();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleRetry = async () => {
    if (!noteId) return;
    
    setIsRetrying(true);
    
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
      } else if (note.original_transcript && note.original_transcript.trim() !== '') {
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
  
  return {
    isRetrying,
    isSyncing,
    handleRetry,
    handleSyncStatus
  };
};
