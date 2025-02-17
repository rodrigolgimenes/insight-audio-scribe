
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Note } from "@/integrations/supabase/types/notes";

export const useFolderNotesQuery = (folderId: string | undefined | null) => {
  const query = useQuery({
    queryKey: ["folder-notes", folderId],
    queryFn: async () => {
      if (folderId === undefined) {
        console.log("No folder ID provided");
        return [];
      }

      if (folderId === null) {
        // For uncategorized notes
        const { data, error } = await supabase
          .from("notes")
          .select(`
            id,
            title,
            original_transcript,
            processed_content,
            full_prompt,
            created_at,
            updated_at,
            recording_id,
            user_id,
            duration,
            audio_url,
            recordings (
              duration
            ),
            notes_tags (
              tags (
                id,
                name,
                color
              )
            )
          `)
          .is('folder_id', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching notes:", error);
          throw error;
        }

        return processNotes(data || []);
      } else {
        // For folder notes
        const { data: noteIds, error: folderError } = await supabase
          .from("notes_folders")
          .select("note_id")
          .eq("folder_id", folderId);

        if (folderError) {
          console.error("Error fetching folder note IDs:", folderError);
          throw folderError;
        }

        if (!noteIds || noteIds.length === 0) {
          console.log("No notes found in folder");
          return [];
        }

        const { data, error } = await supabase
          .from("notes")
          .select(`
            id,
            title,
            original_transcript,
            processed_content,
            full_prompt,
            created_at,
            updated_at,
            recording_id,
            user_id,
            duration,
            audio_url,
            recordings (
              duration
            ),
            notes_tags (
              tags (
                id,
                name,
                color
              )
            )
          `)
          .in('id', noteIds.map(n => n.note_id))
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching notes:", error);
          throw error;
        }

        return processNotes(data || []);
      }
    },
    enabled: folderId !== undefined,
  });

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes_folders'
        },
        (payload: any) => {
          console.log("notes_folders change detected:", payload);
          query.refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        () => {
          console.log("notes change detected, refetching...");
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [folderId, query]);

  return query;
};

const processNotes = (notes: any[]): Note[] => {
  return notes.map(note => ({
    ...note,
    processed_content: note.processed_content || null,
    full_prompt: note.full_prompt || null,
    duration: note.recordings?.duration || note.duration || null,
    audio_url: note.audio_url || null,
    tags: note.notes_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
  }));
};
