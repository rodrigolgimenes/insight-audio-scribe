
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

export const useNoteManagement = () => {
  const { toast } = useToast();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: notes, isLoading, error } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      console.log("Fetching notes...");
      try {
        const { data, error } = await supabase
          .from("notes")
          .select(`
            *,
            recordings (
              duration
            )
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching notes:", error);
          toast({
            title: "Error",
            description: "Failed to fetch notes",
            variant: "destructive",
          });
          throw error;
        }

        if (!data) {
          console.log("No notes found");
          return [];
        }

        const mappedNotes = data.map((note) => ({
          id: note.id,
          title: note.title,
          processed_content: note.processed_content,
          original_transcript: note.original_transcript,
          full_prompt: note.full_prompt,
          created_at: note.created_at,
          updated_at: note.updated_at,
          recording_id: note.recording_id,
          user_id: note.user_id,
          duration: note.recordings?.duration || null,
        } as Note));

        console.log("Mapped notes:", mappedNotes);
        return mappedNotes;
      } catch (error) {
        console.error("Error in notes query:", error);
        throw error;
      }
    },
  });

  const toggleNoteSelection = (note: Note) => {
    setSelectedNotes((prev) =>
      prev.includes(note)
        ? prev.filter((n) => n.id !== note.id)
        : [...prev, note]
    );
  };

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
    } catch (error) {
      console.error("Error in createNewFolder:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar pasta",
        variant: "destructive",
      });
    }
  };

  const handleMoveToFolder = async (folderId: string) => {
    try {
      console.log("Moving notes to folder:", folderId);
      console.log("Selected notes:", selectedNotes);

      for (const note of selectedNotes) {
        const { error } = await supabase
          .rpc('move_note_to_folder', {
            p_note_id: note.id,
            p_folder_id: folderId
          });

        if (error) {
          console.error("Error moving note:", error);
          toast({
            title: "Erro ao mover nota",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["folder-notes"] }),
        queryClient.invalidateQueries({ queryKey: ["folders"] }),
        ...selectedNotes.map(note => 
          queryClient.invalidateQueries({ queryKey: ["note-folder", note.id] })
        )
      ]);

      toast({
        title: "Notas movidas",
        description: "As notas selecionadas foram movidas para a pasta.",
      });
      setIsSelectionMode(false);
      setSelectedNotes([]);
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

  const handleDeleteNotes = async () => {
    try {
      for (const note of selectedNotes) {
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

      toast({
        title: "Notas excluídas",
        description: "As notas selecionadas foram excluídas.",
      });
      setIsSelectionMode(false);
      setSelectedNotes([]);
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
    notes,
    isLoading,
    error,
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    createNewFolder,
    handleMoveToFolder,
    handleDeleteNotes,
  };
};

