
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useFolderNotesQuery = (folderId: string | undefined) => {
  const query = useQuery({
    queryKey: ["folder-notes", folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_folders")
        .select(`
          note:notes (
            id,
            title,
            original_transcript,
            created_at,
            recordings (
              duration
            ),
            notes_tags!left (
              tags:tag_id (
                id,
                name,
                color
              )
            )
          )
        `)
        .eq("folder_id", folderId)
        .order('created_at', { ascending: false, foreignTable: 'notes' });

      if (error) throw error;
      return data.map((item) => ({
        ...item.note,
        duration: item.note.recordings?.duration || null,
        tags: item.note.notes_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
      }));
    },
    staleTime: 0, // Set to 0 to always fetch fresh data when query is refetched
    gcTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    // Subscribe to notes_tags changes for real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notes_tags'
        },
        () => {
          // Refetch data when any notes_tags changes occur
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query.refetch]);

  return query;
};
