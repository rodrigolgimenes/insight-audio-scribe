
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNoteTranscription = () => {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const retryTranscription = async (noteId: string): Promise<boolean> => {
    if (!noteId) return false;
    
    setIsRetrying(true);
    try {
      // Get the recording ID associated with this note
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('recording_id, audio_url')
        .eq('id', noteId)
        .single();
      
      if (noteError || !note) {
        throw new Error('Failed to find recording for this note');
      }
      
      // Reset the note status
      await supabase
        .from('notes')
        .update({
          status: 'pending',
          processing_progress: 10,
          error_message: null
        })
        .eq('id', noteId);
      
      // Invoke the transcribe-audio function
      const { error } = await supabase.functions.invoke('transcribe-audio', {
        body: {
          noteId,
          recordingId: note.recording_id,
          isRetry: true
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Transcription restarted",
        description: "The audio is being re-processed. This may take a few minutes.",
        duration: 5000,
      });
      
      return true;
    } catch (error) {
      console.error('Error retrying transcription:', error);
      toast({
        title: "Error restarting transcription",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRetrying(false);
    }
  };

  const syncNoteStatus = async (noteId: string): Promise<boolean> => {
    if (!noteId) return false;
    
    setIsSyncing(true);
    try {
      // Get the note and check if it has a transcript
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('original_transcript, status')
        .eq('id', noteId)
        .single();
      
      if (noteError || !note) {
        throw new Error('Failed to find note');
      }
      
      // If it has a transcript but status isn't "completed", fix it
      if (note.original_transcript && note.status !== 'completed') {
        await supabase
          .from('notes')
          .update({
            status: 'completed',
            processing_progress: 100
          })
          .eq('id', noteId);
          
        toast({
          title: "Status synchronized",
          description: "The note status has been updated to reflect the completed transcription.",
          duration: 5000,
        });
        
        return true;
      } else {
        toast({
          title: "No synchronization needed",
          description: "The note status is already consistent with its content.",
          duration: 5000,
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error syncing note status:', error);
      toast({
        title: "Error syncing status",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isRetrying,
    isSyncing,
    retryTranscription,
    syncNoteStatus
  };
};
