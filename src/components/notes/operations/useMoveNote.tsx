
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useMoveNote = (noteId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moveNoteToFolder = async (folderId: string) => {
    try {
      const { data: currentFolder } = await supabase
        .from("notes_folders")
        .select("folder_id")
        .eq("note_id", noteId)
        .single();

      if (currentFolder?.folder_id === folderId) {
        toast({
          title: "Note already in folder",
          description: "The note is already in this folder.",
          variant: "destructive",
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from("notes_folders")
        .delete()
        .eq("note_id", noteId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("notes_folders")
        .insert({
          note_id: noteId,
          folder_id: folderId,
        });

      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      await queryClient.invalidateQueries({ queryKey: ["note-folder", noteId] });

      toast({
        title: "Note moved",
        description: "Note has been moved to the selected folder.",
      });
    } catch (error: any) {
      toast({
        title: "Error moving note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { moveNoteToFolder };
};
