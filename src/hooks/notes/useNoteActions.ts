
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";
import { useQueryClient } from "@tanstack/react-query";

export const useNoteActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeleteNotes = async (notes: Note[]) => {
    try {
      for (const note of notes) {
        // Delete note
        const { error } = await supabase
          .from("notes")
          .delete()
          .eq("id", note.id);

        if (error) {
          console.error("Error deleting note:", error);
          toast({
            title: "Erro ao excluir nota",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

      // Immediately invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["folder-notes"] }),
      ]);

      toast({
        title: "Notas excluídas",
        description: "As notas selecionadas foram excluídas.",
      });
    } catch (error) {
      console.error("Error in handleDeleteNotes:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir notas",
        variant: "destructive",
      });
    }
  };

  return {
    handleDeleteNotes,
  };
};
