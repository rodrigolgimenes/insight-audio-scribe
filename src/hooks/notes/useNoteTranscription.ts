
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useNoteTranscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const retryTranscription = async (noteId: string) => {
    try {
      // Update locally for immediate feedback
      await supabase
        .from('notes')
        .update({ 
          status: 'processing',
          processing_progress: 0,
          error_message: null
        })
        .eq('id', noteId);
      
      // Invalidate queries to force data update
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      
      // Call edge function to restart the process
      const { error } = await supabase.functions
        .invoke('transcribe-audio', {
          body: { 
            noteId,
            isRetry: true
          }
        });

      if (error) {
        console.error('Error retrying transcription:', error);
        
        // Restore error status in case of failure
        await supabase
          .from('notes')
          .update({ 
            status: 'error',
            error_message: `Failed to retry: ${error.message}`
          })
          .eq('id', noteId);
        
        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        
        toast({
          title: "Error",
          description: "Failed to retry transcription. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Success",
        description: "Transcription process restarted. This may take a few minutes.",
      });

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
