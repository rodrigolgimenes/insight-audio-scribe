
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";

export const useNotesQuery = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      console.log("Fetching notes...");
      try {
        const { data, error } = await supabase
          .from("notes")
          .select(`
            *,
            recordings (
              duration
            )
          `)
          .order("created_at", { ascending: false });  // This ensures newest notes appear first

        if (error) {
          console.error("Error fetching notes:", error);
          toast({
            title: "Error",
            description: "Failed to fetch notes",
            variant: "destructive",
          });
          throw error;
        }

        if (!data) {
          console.log("No notes found");
          return [];
        }

        const mappedNotes = data.map((note) => ({
          id: note.id,
          title: note.title,
          processed_content: note.processed_content,
          original_transcript: note.original_transcript,
          full_prompt: note.full_prompt,
          created_at: note.created_at,
          updated_at: note.updated_at,
          recording_id: note.recording_id,
          user_id: note.user_id,
          duration: note.recordings?.duration || null,
        } as Note));

        console.log("Mapped notes:", mappedNotes);
        return mappedNotes;
      } catch (error) {
        console.error("Error in notes query:", error);
        throw error;
      }
    },
  });
};
