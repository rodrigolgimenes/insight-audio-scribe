
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useFolderNotesQuery = (folderId: string | undefined) => {
  const query = useQuery({
    queryKey: ["folder-notes", folderId],
    queryFn: async () => {
      if (!folderId) {
        console.log("No folder ID provided");
        return [];
      }

      console.log("Fetching notes for folder:", folderId);
      
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching folder notes:", error);
        throw error;
      }

      console.log("Raw folder notes data:", data);

      const processedNotes = data.map(note => ({
        ...note,
        duration: note.recordings?.duration || null,
        tags: note.notes_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
      }));

      console.log("Processed notes:", processedNotes);
      return processedNotes;
    },
    enabled: !!folderId,
    staleTime: 1000 * 60, // Cache for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  useEffect(() => {
    // Subscribe to relevant table changes for real-time updates
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
          if (payload.new && payload.new.folder_id === folderId) {
            query.refetch();
          }
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
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [folderId, query]);

  return query;
};
