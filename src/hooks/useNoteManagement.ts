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

  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("*, recordings(duration)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching notes:", error);
          toast({
            title: "Error",
            description: "Failed to fetch notes",
            variant: "destructive",
          });
          return [];
        }

        return data as Note[];
      } catch (error) {
        console.error("Error in notes query:", error);
        return [];
      }
    },
    retry: 1,
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
        title: "Folder name is required",
        description: "Please enter a name for the new folder.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please sign in to create folders.",
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
          title: "Error creating folder",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Folder created",
        description: "The new folder has been created successfully.",
      });
      setNewFolderName("");
      setIsFolderDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error in createNewFolder:", error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const handleMoveToFolder = async (folderId: string) => {
    try {
      for (const note of selectedNotes) {
        // First remove from any existing folder
        await supabase
          .from("notes_folders")
          .delete()
          .eq("note_id", note.id);

        // Then add to new folder
        const { error } = await supabase
          .from("notes_folders")
          .insert({ note_id: note.id, folder_id: folderId });

        if (error) {
          console.error("Error moving note:", error);
          toast({
            title: "Error moving note",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Notes moved",
        description: "Selected notes have been moved to the folder.",
      });
      setIsSelectionMode(false);
      setSelectedNotes([]);
      refetch();
      setIsFolderDialogOpen(false);
    } catch (error) {
      console.error("Error in handleMoveToFolder:", error);
      toast({
        title: "Error",
        description: "Failed to move notes",
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
            title: "Error deleting note",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Notes deleted",
        description: "Selected notes have been deleted.",
      });
      setIsSelectionMode(false);
      setSelectedNotes([]);
      refetch();
    } catch (error) {
      console.error("Error in handleDeleteNotes:", error);
      toast({
        title: "Error",
        description: "Failed to delete notes",
        variant: "destructive",
      });
    }
  };

  return {
    notes,
    isLoading,
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