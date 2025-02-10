
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

export const useFolderActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Nome da pasta é obrigatório",
        description: "Por favor, insira um nome para a nova pasta.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Por favor, faça login para criar pastas.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("folders")
        .insert({ 
          name: newFolderName,
          user_id: user.id 
        });

      if (error) {
        console.error("Error creating folder:", error);
        toast({
          title: "Erro ao criar pasta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Pasta criada",
        description: "A nova pasta foi criada com sucesso.",
      });
      setNewFolderName("");
      setIsFolderDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    } catch (error) {
      console.error("Error in createNewFolder:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar pasta",
        variant: "destructive",
      });
    }
  };

  const handleMoveToFolder = async (notes: Note[], folderId: string) => {
    try {
      console.log("Moving notes to folder:", folderId);
      console.log("Selected notes:", notes);

      // Primeiro, remover todas as notas da pasta de destino
      const { error: deleteError } = await supabase
        .from("notes_folders")
        .delete()
        .eq("folder_id", folderId);

      if (deleteError) {
        console.error("Error clearing folder:", deleteError);
        throw deleteError;
      }

      // Depois, mover as notas selecionadas para a pasta
      for (const note of notes) {
        const { error } = await supabase
          .rpc('move_note_to_folder', {
            p_note_id: note.id,
            p_folder_id: folderId
          });

        if (error) {
          console.error("Error moving note:", error);
          throw error;
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["folder-notes"] }),
        queryClient.invalidateQueries({ queryKey: ["folders"] }),
        ...notes.map(note => 
          queryClient.invalidateQueries({ queryKey: ["note-folder", note.id] })
        )
      ]);

      toast({
        title: "Notas movidas",
        description: "As notas selecionadas foram movidas para a pasta.",
      });
      setIsFolderDialogOpen(false);
    } catch (error) {
      console.error("Error in handleMoveToFolder:", error);
      toast({
        title: "Erro",
        description: "Falha ao mover notas",
        variant: "destructive",
      });
    }
  };

  return {
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    createNewFolder,
    handleMoveToFolder,
  };
};
