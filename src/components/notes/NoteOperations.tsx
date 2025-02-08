
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useNoteOperations = (noteId: string) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutateAsync: renameNote, isPending: isRenaming } = useMutation({
    mutationFn: async (newTitle: string) => {
      const { error } = await supabase
        .from("notes")
        .update({ title: newTitle })
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Note renamed",
        description: "The note title has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error) => {
      toast({
        title: "Error renaming note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const moveNoteToFolder = async (folderId: string) => {
    try {
      // First, check if the note is already in the folder
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

      // First, delete any existing folder association
      const { error: deleteError } = await supabase
        .from("notes_folders")
        .delete()
        .eq("note_id", noteId);

      if (deleteError) throw deleteError;

      // Then, add the new folder association
      const { error: insertError } = await supabase
        .from("notes_folders")
        .insert({
          note_id: noteId,
          folder_id: folderId,
        });

      if (insertError) throw insertError;

      // Invalidate queries to update the UI
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

  const addTagToNote = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("notes_tags")
        .insert({
          note_id: noteId,
          tag_id: tagId,
        });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["note-tags", noteId] });

      toast({
        title: "Tag added",
        description: "Tag has been added to the note.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteNote = async () => {
    try {
      // Delete folder associations
      const { error: folderError } = await supabase
        .from("notes_folders")
        .delete()
        .eq("note_id", noteId);

      if (folderError) throw folderError;

      // Delete tag associations
      const { error: tagError } = await supabase
        .from("notes_tags")
        .delete()
        .eq("note_id", noteId);

      if (tagError) throw tagError;

      // Delete the note
      const { error: noteError } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

      if (noteError) throw noteError;

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

  return {
    renameNote,
    isRenaming,
    moveNoteToFolder,
    addTagToNote,
    deleteNote,
  };
};
