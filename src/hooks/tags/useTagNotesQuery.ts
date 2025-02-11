
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/types/notes";
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
          processed_content,
          original_transcript,
          full_prompt,
          created_at,
          updated_at,
          recording_id,
          user_id,
          duration,
          audio_url,
          notes_tags!inner (
            tags (
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
          table: 'notes_tags',
          filter: tagId ? `tag_id=eq.${tagId}` : undefined
        },
        (payload: any) => {
          console.log("notes_tags change detected:", payload);
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
