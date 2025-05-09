
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const useDeleteNote = (noteId: string) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteNote = async () => {
    try {
      // Delete related records first
      const { error: projectError } = await supabase
        .from("notes_projects")
        .delete()
        .eq("note_id", noteId);

      if (projectError) throw projectError;

      const { error: tagError } = await supabase
        .from("notes_tags")
        .delete()
        .eq("note_id", noteId);

      if (tagError) throw tagError;

      const { error: noteError } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

      if (noteError) throw noteError;

      // Immediately invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["project-notes"] }),
      ]);

      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully.",
      });

      navigate("/app");
    } catch (error: any) {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { deleteNote };
};
