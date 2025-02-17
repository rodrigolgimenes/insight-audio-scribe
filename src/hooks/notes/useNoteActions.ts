
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";
import { useQueryClient } from "@tanstack/react-query";

export const useNoteActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeleteNotes = async (notes: Note[]) => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .in("id", notes.map(note => note.id));

      if (error) throw error;

      // Immediately invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["folder-notes"] }),
      ]);

      toast({
        title: "Notes deleted",
        description: "Selected notes have been deleted.",
      });
    } catch (error) {
      console.error("Error in handleDeleteNotes:", error);
      toast({
        title: "Error",
        description: "Failed to delete notes",
        variant: "destructive",
      });
    }
  };

  return {
    handleDeleteNotes,
  };
};
