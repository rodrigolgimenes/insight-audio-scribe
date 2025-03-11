
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";
import { useToast } from "@/components/ui/use-toast";

export const useNoteData = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(noteId || '');

  if (!noteId || !isValidUUID) {
    toast({
      title: "Invalid Note ID",
      description: "The note you're trying to access doesn't exist.",
      variant: "destructive",
    });
    navigate("/app");
    return { note: null, isLoadingNote: false, folders: [], currentFolder: null, tags: [] };
  }

  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      console.log("Fetching note with ID:", noteId);
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          notes_tags!left(
            tags:tag_id(*)
          ),
          notes_folders!left(
            folders:folder_id(*)
          ),
          recordings!inner (duration, status)
        `)
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

      console.log("Note data from database:", data);

      // Determine the correct status based on both note and recording status
      let noteStatus = data.status;
      const recordingStatus = data.recordings?.status;

      // If recording is completed and we have original_transcript, the note should be completed
      if (recordingStatus === 'completed' && data.original_transcript) {
        noteStatus = 'completed';
      }

      // Ensure the status is one of the allowed values
      const validStatus: Note['status'] = 
        ['pending', 'processing', 'transcribing', 'completed', 'error'].includes(noteStatus) 
          ? noteStatus as Note['status']
          : 'processing';

      const transformedNote: Note = {
        id: data.id,
        title: data.title,
        processed_content: data.processed_content,
        original_transcript: data.original_transcript,
        full_prompt: data.full_prompt,
        created_at: data.created_at,
        updated_at: data.updated_at,
        recording_id: data.recording_id,
        user_id: data.user_id,
        duration: data.recordings?.duration || null,
        audio_url: data.audio_url || null,
        status: validStatus,
        processing_progress: data.processing_progress || 0
      };

      // If the note should be completed but isn't, update it
      if (validStatus === 'completed' && data.status !== 'completed') {
        await supabase
          .from('notes')
          .update({ 
            status: 'completed',
            processing_progress: 100 
          })
          .eq('id', data.id);
      }

      return transformedNote;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: false,
  });

  const { data: tags } = useQuery({
    queryKey: ["note-tags", noteId],
    queryFn: async () => {
      console.log("Fetching tags for note:", noteId);
      const { data, error } = await supabase
        .from("tags")
        .select("*, notes_tags!inner(note_id)")
        .eq("notes_tags.note_id", noteId);

      if (error) throw error;
      return data;
    },
    enabled: !!noteId && isValidUUID,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const { data: currentFolder } = useQuery({
    queryKey: ["note-folder", noteId],
    queryFn: async () => {
      console.log("Fetching current folder for note:", noteId);
      const { data, error } = await supabase
        .from("folders")
        .select("*, notes_folders!inner(*)")
        .eq("notes_folders.note_id", noteId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching folder:", error);
        throw error;
      }
      return data;
    },
    enabled: !!noteId && isValidUUID,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  return {
    note,
    isLoadingNote,
    folders,
    currentFolder,
    tags,
  };
};
