
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

export const useNotesQuery = () => {
  const fetchNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("notes")
      .select(`
        *,
        recording_id,
        folder:notes_folders(
          folder_id
        )
      `)
      .eq('user_id', user.id)
      // Só buscar notas que tenham conteúdo
      .not('original_transcript', 'is', null)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data as Note[];
  };

  return useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes
  });
};
