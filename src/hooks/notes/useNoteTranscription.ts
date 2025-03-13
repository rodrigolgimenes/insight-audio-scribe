
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
      
      // Implement retry logic with multiple attempts
      let success = false;
      let attempt = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempt < maxAttempts && !success) {
        attempt++;
        console.log(`Transcription retry attempt ${attempt} of ${maxAttempts}`);
        
        try {
          // Call edge function to restart the process
          const { error } = await supabase.functions
            .invoke('process-recording', {
              body: { 
                recordingId: note.recording_id,
                noteId,
                isRetry: true
              }
            });
  
          if (error) {
            console.error(`Attempt ${attempt} error from process-recording function:`, error);
            lastError = error;
            // Wait a bit longer between retries
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          } else {
            success = true;
            break;
          }
        } catch (attemptError) {
          console.error(`Attempt ${attempt} exception:`, attemptError);
          lastError = attemptError;
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
      }

      if (!success) {
        console.error('All transcription retry attempts failed');
        
        // Restore error status in case of failure
        await supabase
          .from('notes')
          .update({ 
            status: 'error',
            error_message: `Failed to start: ${lastError?.message || 'Maximum retry attempts exceeded'}`
          })
          .eq('id', noteId);
        
        if (note.recording_id) {
          await supabase
            .from('recordings')
            .update({ 
              status: 'error',
              error_message: `Failed to start: ${lastError?.message || 'Maximum retry attempts exceeded'}`
            })
            .eq('id', note.recording_id);
        }
        
        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        
        toast({
          title: "Error",
          description: "Failed to start processing. Please try again later.",
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
