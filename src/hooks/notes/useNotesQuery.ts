
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/types/notes";
import { useToast } from "@/components/ui/use-toast";

interface DatabaseNote {
  id: string;
  title: string;
  original_transcript: string | null;
  processed_content: string | null;
  full_prompt: string | null;
  created_at: string;
  updated_at: string;
  recording_id: string;
  user_id: string;
  duration: number | null;
  audio_url: string | null;
  status: string;
  processing_progress: number | null;
  error_message: string | null;
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
  }> | null;
}

export const useNotesQuery = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["uncategorized-notes-projects"],
    queryFn: async () => {
      try {
        console.log("Fetching uncategorized notes...");
        
        // Check if user is authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          console.error("No active session found");
          return [] as Note[];
        }
        
        // First, get notes without projects from the view
        const { data, error } = await supabase
          .from("notes_without_projects")
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

        if (error) {
          console.error("Error fetching notes_without_projects:", error);
          toast({
            title: "Error fetching notes",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} uncategorized notes`);
        
        // If no data, return empty array
        if (!data || data.length === 0) {
          return [] as Note[];
        }
        
        // Get the note IDs to check their status in the notes table
        const noteIds = data.map(note => note.id).filter(Boolean);
        
        if (noteIds.length === 0) {
          return [] as Note[];
        }
        
        // Fetch status information from the actual notes table
        const { data: notesWithStatus, error: statusError } = await supabase
          .from("notes")
          .select("id, status, processing_progress, original_transcript")
          .in('id', noteIds);
          
        if (statusError) {
          console.error("Error fetching note statuses:", statusError);
        }
        
        // Create a map of note statuses for quick lookup
        const statusMap = new Map();
        const notesToUpdate = [];
        
        (notesWithStatus || []).forEach(note => {
          statusMap.set(note.id, {
            status: note.status,
            processing_progress: note.processing_progress || 0
          });
          
          // Check if note should be completed but isn't
          if (note.original_transcript && 
              (note.status === 'processing' || note.status === 'transcribing')) {
            notesToUpdate.push(note.id);
          }
        });
        
        // Update notes that should be completed
        if (notesToUpdate.length > 0) {
          await supabase
            .from('notes')
            .update({ 
              status: 'completed',
              processing_progress: 100 
            })
            .in('id', notesToUpdate);
          
          // Update our status map with the new statuses
          notesToUpdate.forEach(id => {
            statusMap.set(id, { status: 'completed', processing_progress: 100 });
          });
        }
        
        // Merge the data from notes_without_projects with status information
        const transformedNotes: Note[] = (data || []).map((note: DatabaseNote) => {
          const statusInfo = statusMap.get(note.id) || { 
            status: 'processing', 
            processing_progress: 0 
          };
          
          return {
            id: note.id,
            title: note.title || "Untitled",
            processed_content: note.processed_content || "",
            original_transcript: note.original_transcript,
            full_prompt: note.full_prompt,
            created_at: note.created_at,
            updated_at: note.updated_at,
            recording_id: note.recording_id,
            user_id: note.user_id,
            duration: note.duration,
            audio_url: note.audio_url,
            status: statusInfo.status as Note['status'],
            processing_progress: statusInfo.processing_progress,
            error_message: note.error_message,
            tags: note.tags || []
          };
        });
        
        return transformedNotes;
      } catch (error) {
        console.error("Error in useNotesQuery:", error);
        toast({
          title: "Error loading notes",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
        throw error;
      }
    },
    refetchInterval: 4000, // Refetch every 4 seconds
    staleTime: 1000 // Data becomes stale after 1 second
  });
};
