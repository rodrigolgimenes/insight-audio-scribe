
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFolderNotesQuery = (folderId: string | undefined) => {
  return useQuery({
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
        tags: item.note.notes_tags?.map((nt: any) => nt.tags) || []
      }));
    },
  });
};
