
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const useProjectNoteSelection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

  const deleteSelectedNotes = async () => {
    try {
      for (const noteId of selectedNotes) {
        const { error: projectError } = await supabase
          .from("notes_projects")
          .delete()
          .eq("note_id", noteId);

        if (projectError) {
          toast({
            title: "Error deleting project associations",
            description: projectError.message,
            variant: "destructive",
          });
          return;
        }

        const { error: tagError } = await supabase
          .from("notes_tags")
          .delete()
          .eq("note_id", noteId);

        if (tagError) {
          toast({
            title: "Error deleting tag associations",
            description: tagError.message,
            variant: "destructive",
          });
          return;
        }

        const { error: noteError } = await supabase
          .from("notes")
          .delete()
          .eq("id", noteId);

        if (noteError) {
          toast({
            title: "Error deleting note",
            description: noteError.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Notes deleted",
        description: "Selected notes have been deleted successfully.",
      });

      setSelectedNotes([]);
      setIsSelectionMode(false);
      queryClient.invalidateQueries({ queryKey: ["project-notes"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notes",
        variant: "destructive",
      });
    }
  };

  return {
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    deleteSelectedNotes,
  };
};
