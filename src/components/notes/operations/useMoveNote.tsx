
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useMoveNote = (noteId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moveNoteToFolder = async (folderId: string) => {
    try {
      // First check if note is already in the target folder
      const { data: currentFolder } = await supabase
        .from("notes_folders")
        .select("folder_id")
        .eq("note_id", noteId)
        .maybeSingle();

      if (currentFolder?.folder_id === folderId) {
        toast({
          title: "Note already in folder",
          description: "The note is already in this folder.",
          variant: "destructive",
        });
        return;
      }

      // Delete any existing folder associations using transaction
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
      await queryClient.invalidateQueries({ queryKey: ["folders"] });

      toast({
        title: "Note moved",
        description: "Note has been moved to the selected folder.",
      });
    } catch (error: any) {
      console.error("Error moving note:", error);
      toast({
        title: "Error moving note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { moveNoteToFolder };
};
