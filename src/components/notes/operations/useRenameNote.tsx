
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";

export const useRenameNote = (noteId: string) => {
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

  return { renameNote, isRenaming };
};
