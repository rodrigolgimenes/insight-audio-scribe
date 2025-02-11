
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useFolderNotesQuery = (folderId: string | undefined) => {
  const query = useQuery({
    queryKey: ["folder-notes", folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select(`
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
        `)
        .eq("notes_folders.folder_id", folderId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data.map((note) => ({
        ...note,
        duration: note.recordings?.duration || null,
        tags: note.notes_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
      }));
    },
    staleTime: 0,
    gcTime: 0, // This ensures immediate garbage collection and refetching
  });

  useEffect(() => {
    // Subscribe to notes_tags changes for real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        () => {
          // Refetch data when any changes occur
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  return query;
};
