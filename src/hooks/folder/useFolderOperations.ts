
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useFolderOperations = (folderId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return { renameFolder, isRenaming };
};
