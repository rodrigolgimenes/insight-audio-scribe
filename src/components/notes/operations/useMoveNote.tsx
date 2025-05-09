
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useMoveNote = (noteId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moveNoteToProject = async (projectId: string) => {
    try {
      console.log("Moving note", noteId, "to project", projectId);
      
      // Use the database function to move the note
      const { error: moveError } = await supabase
        .rpc('move_note_to_project', {
          p_note_id: noteId,
          p_project_id: projectId
        });

      if (moveError) {
        console.error("Error from move_note_to_project:", moveError);
        throw moveError;
      }

      // Invalidate queries to refresh the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["note", noteId] }),
        queryClient.invalidateQueries({ queryKey: ["note-project", noteId] }),
        queryClient.invalidateQueries({ queryKey: ["project-notes"] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] })
      ]);

      toast({
        title: "Note moved",
        description: "The note has been moved to the selected project.",
      });
    } catch (error: any) {
      console.error("Error moving note:", error);
      toast({
        title: "Error moving note",
        description: error.message,
        variant: "destructive",
      });
      throw error; // Re-throw to handle in the component
    }
  };

  return { moveNoteToProject };
};
