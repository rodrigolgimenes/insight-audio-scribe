
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useNoteTranscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const retryTranscription = async (noteId: string) => {
    console.log('Retrying transcription for note:', noteId);
    try {
      // Get note data first to check status
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('id, recording_id, status, error_message')
        .eq('id', noteId)
        .single();
      
      if (noteError || !note) {
        console.error('Error fetching note data for retry:', noteError);
        throw new Error('Could not find note data');
      }
      
      console.log('Current note status before retry:', note.status);
      
      // Update locally for immediate feedback
      await supabase
        .from('notes')
        .update({ 
          status: 'processing',
          processing_progress: 10,
          error_message: null
        })
        .eq('id', noteId);
      
      // Update recording status too
      if (note.recording_id) {
        await supabase
          .from('recordings')
          .update({ 
            status: 'processing',
            error_message: null
          })
          .eq('id', note.recording_id);
        
        console.log('Updated recording status for retry');
      }
      
      // Invalidate queries to force data update
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      
      // Call edge function to restart the process
      console.log('Calling transcribe-audio function for retry');
      const { error } = await supabase.functions
        .invoke('transcribe-audio', {
          body: { 
            noteId,
            recordingId: note.recording_id,
            isRetry: true
          }
        });

      if (error) {
        console.error('Error from transcribe-audio function:', error);
        
        // Restore error status in case of failure
        await supabase
          .from('notes')
          .update({ 
            status: 'error',
            error_message: `Failed to start: ${error.message}`
          })
          .eq('id', noteId);
        
        if (note.recording_id) {
          await supabase
            .from('recordings')
            .update({ 
              status: 'error',
              error_message: `Failed to start: ${error.message}`
            })
            .eq('id', note.recording_id);
        }
        
        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        
        toast({
          title: "Error",
          description: "Failed to start processing. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Processing started",
        description: "Transcription process has been initiated. This may take a few minutes.",
      });

      console.log('Transcription process initiated successfully');
      return true;
    } catch (error) {
      console.error('Exception in retryTranscription:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return { retryTranscription };
};
