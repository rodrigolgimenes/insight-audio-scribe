
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

export const useUncategorizedNotes = () => {
  return useQuery({
    queryKey: ["uncategorized-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          tags:notes_tags(
            tags(*)
          )
        `)
        .is("project_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the notes to match the Note type
      const transformedNotes: Note[] = (data || []).map((note) => {
        const noteTags = note.notes_tags || [];
        return {
          ...note,
          tags: noteTags.map((nt: any) => nt.tags || {})
        };
      });
      
      return transformedNotes;
    },
  });
};
