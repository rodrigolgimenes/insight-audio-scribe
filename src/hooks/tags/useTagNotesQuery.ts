
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";
import { useEffect } from "react";

export const useTagNotesQuery = (tagId: string | undefined) => {
  const query = useQuery({
    queryKey: ["tag-notes", tagId],
    queryFn: async () => {
      console.log("Fetching notes for tag:", tagId);

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
        .eq("notes_tags.tag_id", tagId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tag notes:", error);
        throw error;
      }

      console.log("Raw tag notes data:", data);

      const processedNotes = data.map(note => ({
        ...note,
        duration: note.recordings?.duration || null,
        tags: note.notes_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
      }));

      console.log("Processed tag notes:", processedNotes);
      return processedNotes;
    },
    enabled: !!tagId,
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
          table: 'notes_tags'
        },
        (payload: any) => {
          console.log("notes_tags change detected:", payload);
          if (payload.old?.tag_id === tagId || payload.new?.tag_id === tagId) {
            console.log("Relevant tag change detected, refetching...");
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
  }, [tagId, query]);

  return query;
};
