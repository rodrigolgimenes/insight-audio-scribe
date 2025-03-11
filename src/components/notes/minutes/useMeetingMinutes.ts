
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MinutesData {
  content: string;
  format: 'plain' | 'markdown' | 'html';
}

export const useMeetingMinutes = (noteId: string, initialContent?: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: minutes, isLoading: isLoadingMinutes } = useQuery({
    queryKey: ['meeting-minutes', noteId],
    queryFn: async () => {
      console.log('Fetching meeting minutes for note:', noteId);
      try {
        const { data, error } = await supabase
          .from('meeting_minutes')
          .select('content, format')
          .eq('note_id', noteId)
          .maybeSingle<MinutesData>();

        if (error) {
          console.error('Error fetching meeting minutes:', error);
          throw error;
        }

        console.log('Meeting minutes data:', data);
        return data?.content || '';
      } catch (error) {
        console.error('Error in queryFn:', error);
        throw error;
      }
    },
    initialData: initialContent || '',
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
  });

  const { mutate: generateMinutes, isPending: isGenerating } = useMutation({
    mutationFn: async ({ isRegeneration = false }: { isRegeneration: boolean }) => {
      if (!noteId) {
        throw new Error("Note ID is required to generate minutes.");
      }

      const { data, error: functionError } = await supabase.functions.invoke('generate-meeting-minutes', {
        body: { 
          noteId,
          isRegeneration: false // Always use false now since we removed regeneration
        },
      });

      if (functionError || !data?.minutes) {
        console.error('Error from edge function:', functionError);
        throw new Error(functionError?.message || "Failed to generate meeting minutes");
      }

      return data.minutes;
    },
    onSuccess: (newMinutes) => {
      queryClient.setQueryData(['meeting-minutes', noteId], newMinutes);
      toast({
        title: "Success",
        description: "Meeting minutes generated successfully",
      });
    },
    onError: (error) => {
      console.error('Error generating meeting minutes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate meeting minutes",
        variant: "destructive",
      });
    }
  });

  const { mutate: updateMinutes, isPending: isUpdating } = useMutation({
    mutationFn: async (content: string) => {
      console.log('Updating minutes with content:', content);
      try {
        const { error } = await supabase
          .from('meeting_minutes')
          .upsert([{
            note_id: noteId,
            content: content,
            format: 'markdown',
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'note_id'
          });

        if (error) {
          console.error('Error updating meeting minutes:', error);
          throw error;
        }

        const { data: updatedData, error: fetchError } = await supabase
          .from('meeting_minutes')
          .select('content')
          .eq('note_id', noteId)
          .single();

        if (fetchError) {
          console.error('Error fetching updated minutes:', fetchError);
          throw fetchError;
        }

        console.log('Minutes updated successfully:', updatedData);
        return updatedData.content;
      } catch (error) {
        console.error('Error in updateMinutes mutation:', error);
        throw error;
      }
    },
    onSuccess: (newContent) => {
      queryClient.setQueryData(['meeting-minutes', noteId], newContent);
      queryClient.invalidateQueries({ queryKey: ['meeting-minutes', noteId] });
      toast({
        title: "Success",
        description: "Meeting minutes saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating meeting minutes:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save meeting minutes",
        variant: "destructive",
      });
      throw error;
    }
  });

  return {
    minutes,
    isLoadingMinutes,
    generateMinutes,
    isGenerating,
    updateMinutes,
    isUpdating
  };
};
