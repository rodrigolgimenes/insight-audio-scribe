
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useNoteTranscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const retryTranscription = async (noteId: string) => {
    const { error } = await supabase.functions
      .invoke('transcribe-audio', {
        body: { 
          noteId,
          isRetry: true
        }
      });

    if (error) {
      console.error('Error retrying transcription:', error);
      toast({
        title: "Error",
        description: "Failed to retry transcription. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    // Update note status locally
    await supabase
      .from('notes')
      .update({ 
        status: 'processing',
        processing_progress: 0,
        error_message: null
      })
      .eq('id', noteId);

    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['note', noteId] });
    queryClient.invalidateQueries({ queryKey: ['note-tags', noteId] });
    
    toast({
      title: "Success",
      description: "Transcription process restarted. This may take a few minutes.",
    });

    return true;
  };

  return { retryTranscription };
};
