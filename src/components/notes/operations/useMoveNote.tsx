
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useMoveNote = (noteId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moveNoteToFolder = async (folderId: string) => {
    try {
      // Use the database function to move the note
      const { error: moveError } = await supabase
        .rpc('move_note_to_folder', {
          p_note_id: noteId,
          p_folder_id: folderId
        });

      if (moveError) throw moveError;

      // Invalidate queries to refresh the UI
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      await queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      await queryClient.invalidateQueries({ queryKey: ["note-folder", noteId] });
      await queryClient.invalidateQueries({ queryKey: ["folder-notes"] });
      await queryClient.invalidateQueries({ queryKey: ["folders"] });

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
    }
  };

  return { moveNoteToFolder };
};
