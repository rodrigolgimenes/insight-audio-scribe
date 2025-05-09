
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useProjectNotesQuery = (projectId: string | undefined) => {
  const query = useQuery({
    queryKey: ["project-notes", projectId],
    queryFn: async () => {
      if (!projectId) {
        console.log("No project ID provided");
        return [];
      }

      console.log("Fetching notes for project:", projectId);
      
      // First get the note IDs from notes_projects
      const { data: noteIds, error: projectError } = await supabase
        .from("notes_projects")
        .select("note_id")
        .eq("project_id", projectId);

      if (projectError) {
        console.error("Error fetching project note IDs:", projectError);
        throw projectError;
      }

      if (!noteIds || noteIds.length === 0) {
        console.log("No notes found in project");
        return [];
      }

      // Then fetch the complete note data for these IDs
      const { data, error } = await supabase
        .from("notes")
        .select(`
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
        `)
        .in('id', noteIds.map(n => n.note_id))
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching project notes:", error);
        throw error;
      }

      console.log("Raw project notes data:", data);

      const processedNotes = data.map(note => {
        // Handle recordings property which might be an array with a single object or null
        let duration = null;
        if (note.recordings) {
          // Check if recordings is an array
          if (Array.isArray(note.recordings) && note.recordings.length > 0) {
            // Access duration from the first item in the array
            duration = note.recordings[0]?.duration || null;
          } else if (typeof note.recordings === 'object' && note.recordings !== null) {
            // If it's a single object with a duration property
            duration = (note.recordings as { duration?: any })?.duration || null;
          }
        }

        return {
          ...note,
          duration: duration,
          tags: note.notes_tags?.map((nt: any) => nt.tags).filter(Boolean) || []
        };
      });

      console.log("Processed notes:", processedNotes);
      return processedNotes;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60, // Cache for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  useEffect(() => {
    // Subscribe to relevant table changes for real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes_projects'
        },
        (payload: any) => {
          console.log("notes_projects change detected:", payload);
          if (payload.new && payload.new.project_id === projectId) {
            query.refetch();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        () => {
          console.log("notes change detected, refetching...");
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [projectId, query]);

  return query;
};
