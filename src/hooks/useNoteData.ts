import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";
import { useToast } from "@/components/ui/use-toast";

export const useNoteData = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate noteId is a valid UUID
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(noteId || '');

  if (!noteId || !isValidUUID) {
    toast({
      title: "Invalid Note ID",
      description: "The note you're trying to access doesn't exist.",
      variant: "destructive",
    });
    navigate("/app");
    return { note: null, isLoadingNote: false, folders: [], currentFolder: null };
  }

  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      console.log("Fetching note with ID:", noteId);
      const { data, error } = await supabase
        .from("notes")
        .select("*, notes_tags(tag_id), notes_folders(folder_id)")
        .eq("id", noteId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching note:", error);
        throw error;
      }

      if (!data) {
        toast({
          title: "Note not found",
          description: "The note you're trying to access doesn't exist.",
          variant: "destructive",
        });
        navigate("/app");
        return null;
      }

      return data as Note;
    },
    retry: false,
  });

  const { data: folders } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      console.log("Fetching folders");
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!noteId && isValidUUID,
  });

  const { data: currentFolder } = useQuery({
    queryKey: ["note-folder", noteId],
    queryFn: async () => {
      console.log("Fetching current folder for note:", noteId);
      const { data, error } = await supabase
        .from("notes_folders")
        .select("folder_id")
        .eq("note_id", noteId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching folder:", error);
        throw error;
      }
      return data;
    },
    enabled: !!noteId && isValidUUID,
  });

  return {
    note,
    isLoadingNote,
    folders,
    currentFolder,
  };
};