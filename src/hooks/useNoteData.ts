import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/types/notes";

export const useNoteData = () => {
  const { noteId } = useParams();

  if (!noteId) {
    throw new Error("Note ID is required");
  }

  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*, notes_tags(tag_id), notes_folders(folder_id)")
        .eq("id", noteId)
        .single();

      if (error) throw error;
      return data as Note;
    },
  });

  const { data: folders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: currentFolder } = useQuery({
    queryKey: ["note-folder", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_folders")
        .select("folder_id")
        .eq("note_id", noteId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  return {
    note,
    isLoadingNote,
    folders,
    currentFolder,
  };
};