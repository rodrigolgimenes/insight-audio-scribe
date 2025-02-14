
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";
import { Query } from "@tanstack/react-query";

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
      // Filtrar notas vazias ou em processamento
      .or('original_transcript.neq.null,status.eq.processing')
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Filtrar notas que estão em processamento há muito tempo (possível erro)
    const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 horas em milissegundos
    const notes = data as Note[];
    
    return notes.filter(note => {
      if (note.status === 'processing') {
        const createdAt = new Date(note.created_at).getTime();
        const now = new Date().getTime();
        return now - createdAt < TWO_HOURS;
      }
      return true;
    });
  };

  return useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
    // Reduzir a frequência de atualizações
    refetchInterval: (query: Query<Note[], Error, Note[], string[]>) => {
      // Se houver notas em processamento, atualizar a cada 5 segundos
      if (query.state.data?.some(note => note.status === 'processing')) {
        return 5000;
      }
      // Caso contrário, não atualizar automaticamente
      return false;
    }
  });
};
