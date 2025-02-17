
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

interface NoteWithTags extends Note {
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export const useNotesQuery = () => {
  return useQuery({
    queryKey: ["uncategorized-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_without_folders")
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
          tags (
            id,
            name,
            color
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as NoteWithTags[];
    },
  });
};
