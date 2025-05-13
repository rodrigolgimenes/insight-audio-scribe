
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

export const useFolderNotesQuery = (folderId: string | null) => {
  return useQuery({
    queryKey: ["folder-notes", folderId],
    queryFn: async () => {
      if (!folderId) return [];
      
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          tags:notes_tags(
            tags(*)
          )
        `)
        .eq("id", supabase.rpc("get_folder_notes", { p_folder_id: folderId }))
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const transformedNotes: Note[] = (data || []).map((note) => {
        const noteTags = note.notes_tags || [];
        return {
          ...note,
          tags: noteTags.map((nt: any) => nt.tags || {})
        };
      });
      
      return transformedNotes;
    },
    enabled: !!folderId,
  });
};
