
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
          status,
          processing_progress,
          tags (
            id,
            name,
            color
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Check for notes that should be completed but aren't
      const notesToUpdate = [];
      for (const note of data || []) {
        if (note.original_transcript && 
            (note.status === 'processing' || note.status === 'transcribing')) {
          notesToUpdate.push(note.id);
        }
      }
      
      // Update status for notes that have transcripts but aren't marked as completed
      if (notesToUpdate.length > 0) {
        await supabase
          .from('notes')
          .update({ 
            status: 'completed',
            processing_progress: 100 
          })
          .in('id', notesToUpdate);
          
        // Refresh the data after updates
        const { data: updatedData } = await supabase
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
            status,
            processing_progress,
            tags (
              id,
              name,
              color
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);
          
        return (updatedData || []) as NoteWithTags[];
      }
      
      return (data || []) as NoteWithTags[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds to catch status updates
  });
};
