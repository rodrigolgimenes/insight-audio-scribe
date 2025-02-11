
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

export const useTagNotesQuery = (tagId: string | undefined) => {
  return useQuery({
    queryKey: ["tag-notes", tagId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_tags")
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
        .eq("tag_id", tagId)
        .order('created_at', { ascending: false, foreignTable: 'notes' });

      if (error) throw error;
      return data.map((item) => ({
        ...item.note,
        duration: item.note.recordings?.duration || null,
        tags: item.note.notes_tags?.map((nt: any) => nt.tags) || []
      }));
    },
    enabled: !!tagId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });
};
