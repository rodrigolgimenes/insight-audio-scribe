
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useMoveNote = (noteId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moveNoteToFolder = async (folderId: string) => {
    try {
      console.log("Moving note", noteId, "to folder", folderId);
      
      // Use the database function to move the note
      const { error: moveError } = await supabase
        .rpc('move_note_to_folder', {
          p_note_id: noteId,
          p_folder_id: folderId
        });

      if (moveError) {
        console.error("Error from move_note_to_folder:", moveError);
        throw moveError;
      }

      // Invalidate queries to refresh the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["note", noteId] }),
        queryClient.invalidateQueries({ queryKey: ["note-folder", noteId] }),
        queryClient.invalidateQueries({ queryKey: ["folder-notes"] }),
        queryClient.invalidateQueries({ queryKey: ["folders"] })
      ]);

      toast({
        title: "Nota movida",
        description: "A nota foi movida para a pasta selecionada.",
      });
    } catch (error: any) {
      console.error("Error moving note:", error);
      toast({
        title: "Erro ao mover nota",
        description: error.message,
        variant: "destructive",
      });
      throw error; // Re-throw to handle in the component
    }
  };

  return { moveNoteToFolder };
};

