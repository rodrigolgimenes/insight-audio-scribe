import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useNoteOperations = (noteId: string) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const moveNoteToFolder = async (folderId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("notes_folders")
        .delete()
        .eq("note_id", noteId);

      if (deleteError) {
        toast({
          title: "Error removing from current folder",
          description: deleteError.message,
          variant: "destructive",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from("notes_folders")
        .insert({
          note_id: noteId,
          folder_id: folderId,
        });

      if (insertError) {
        toast({
          title: "Error moving note",
          description: insertError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Note moved",
        description: "Note has been moved to the selected folder.",
      });
    } catch (error) {
      toast({
        title: "Error moving note",
        description: "Failed to move note to folder",
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

      if (error) {
        toast({
          title: "Error adding tag",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tag added",
        description: "Tag has been added to the note.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async () => {
    try {
      const { error: folderError } = await supabase
        .from("notes_folders")
        .delete()
        .eq("note_id", noteId);

      if (folderError) {
        toast({
          title: "Error deleting folder associations",
          description: folderError.message,
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

      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully.",
      });

      navigate("/app");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  return {
    moveNoteToFolder,
    addTagToNote,
    deleteNote,
  };
};