
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
      const { data, error } = await supabase
        .from('meeting_minutes')
        .select<'meeting_minutes', MinutesData>('content, format')
        .eq('note_id', noteId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching meeting minutes:', error);
        throw error;
      }

      console.log('Meeting minutes data:', data);
      // If no data is found, return null
      if (!data) return null;
      
      // Return just the content since that's what the rest of the code expects
      return data.content;
    },
    initialData: initialContent || undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { mutate: generateMinutes, isPending: isGenerating } = useMutation({
    mutationFn: async ({ isRegeneration = false }: { isRegeneration: boolean }) => {
      if (!noteId) {
        throw new Error("Note ID is required to generate minutes.");
      }

      const { data, error: functionError } = await supabase.functions.invoke('generate-meeting-minutes', {
        body: { 
          noteId,
          isRegeneration
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
      const { error } = await supabase
        .from('meeting_minutes')
        .upsert({
          note_id: noteId,
          content,
          format: 'markdown',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return content;
    },
    onSuccess: (newContent) => {
      queryClient.setQueryData(['meeting-minutes', noteId], newContent);
      toast({
        title: "Success",
        description: "Meeting minutes updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating meeting minutes:', error);
      toast({
        title: "Error",
        description: "Failed to update meeting minutes",
        variant: "destructive",
      });
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
