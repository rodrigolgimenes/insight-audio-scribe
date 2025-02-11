
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const useFolderOperations = (folderId: string) => {
  const { toast } = useToast();
  const queryClient } = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync: renameFolder, isPending: isRenaming } = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase
        .from("folders")
        .update({ name: newName })
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Folder renamed",
        description: "The folder name has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["folder", folderId] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: (error) => {
      toast({
        title: "Error renaming folder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: deleteFolder, isPending: isDeleting } = useMutation({
    mutationFn: async (deleteNotes: boolean) => {
      if (deleteNotes) {
        // Get all notes in the folder
        const { data: notesInFolder } = await supabase
          .from("notes_folders")
          .select("note_id")
          .eq("folder_id", folderId);

        if (notesInFolder) {
          // Delete all notes in the folder
          for (const { note_id } of notesInFolder) {
            await supabase.from("notes").delete().eq("id", note_id);
          }
        }
      } else {
        // Move notes to uncategorized by deleting their folder association
        await supabase
          .from("notes_folders")
          .delete()
          .eq("folder_id", folderId);
      }

      // Delete the folder
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Folder deleted",
        description: "The folder has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      // Immediately navigate to dashboard after successful deletion
      navigate("/app", { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Error deleting folder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { 
    renameFolder, 
    isRenaming, 
    deleteFolder,
    isDeleting 
  };
};
