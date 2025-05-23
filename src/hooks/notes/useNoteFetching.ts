
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/integrations/supabase/types/notes";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export const useNoteFetching = (noteId: string | undefined, isValidNoteId: boolean) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: note, isLoading: isLoadingNote } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      if (!noteId || !isValidNoteId) return null;
      
      console.log("Fetching note with ID:", noteId);
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          notes_tags!left(
            tags:tag_id(*)
          ),
          notes_projects!left(
            projects:project_id(*)
          ),
          recordings!inner (id, duration, status, transcription)
        `)
        .eq("id", noteId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching note:", error);
        throw error;
      }

      if (!data) {
        toast({
          title: "Note not found",
          description: "The note you're trying to access doesn't exist.",
          variant: "destructive",
        });
        navigate("/app");
        return null;
      }

      console.log("Note data from database:", data);
      console.log("Recording duration data:", data.recordings?.duration);
      console.log("Note duration data:", data.duration);

      // Handle possible inconsistencies between note and recording data
      const recordingData = data.recordings;
      let noteStatus = data.status;
      let noteTranscript = data.original_transcript;
      
      // Se a nota não tem duração mas a gravação tem, sincronize
      if ((!data.duration || data.duration === 0) && recordingData?.duration && recordingData.duration > 0) {
        console.log("Fixing inconsistency: recording has duration but note doesn't");
        
        try {
          await supabase
            .from('notes')
            .update({ 
              duration: recordingData.duration
            })
            .eq('id', data.id);
            
          console.log("Note updated with duration from recording");
          // Atualize o valor de duração localmente para exibição imediata
          data.duration = recordingData.duration;
        } catch (err) {
          console.error("Error updating note with recording duration:", err);
        }
      }
      
      // If recording has transcript but note doesn't, use it and update
      if (recordingData?.transcription && (!noteTranscript || noteTranscript.trim() === '')) {
        console.log("Fixing inconsistency: recording has transcript but note doesn't");
        noteTranscript = recordingData.transcription;
        
        // Update the note in the background using try/catch
        try {
          await supabase
            .from('notes')
            .update({ 
              original_transcript: recordingData.transcription,
              status: 'completed',
              processing_progress: 100
            })
            .eq('id', data.id);
            
          console.log("Note updated with transcript from recording");
        } catch (err) {
          console.error("Error updating note with recording transcript:", err);
        }
      }
      
      // Additional check: If meeting minutes exist, but original transcript doesn't, fetch the transcript from recordings
      if (!noteTranscript || noteTranscript.trim() === '') {
        try {
          // Check if meeting minutes exist for this note
          const { data: minutesData } = await supabase
            .from('meeting_minutes')
            .select('*')
            .eq('note_id', data.id)
            .maybeSingle();
            
          if (minutesData && recordingData?.id) {
            console.log("Meeting minutes exist but no transcript found, fetching from recording");
            
            // Get latest transcription data from recordings
            const { data: latestRecording } = await supabase
              .from('recordings')
              .select('transcription')
              .eq('id', recordingData.id)
              .single();
              
            if (latestRecording?.transcription) {
              console.log("Found transcript in recording, updating note");
              noteTranscript = latestRecording.transcription;
              
              await supabase
                .from('notes')
                .update({ 
                  original_transcript: latestRecording.transcription,
                  status: 'completed',
                  processing_progress: 100
                })
                .eq('id', data.id);
                
              console.log("Note updated with transcript from latest recording data");
            }
          }
        } catch (syncError) {
          console.error("Error trying to sync transcript data:", syncError);
        }
      }
      
      // If we have a transcript, the status should be completed
      if (noteTranscript && noteTranscript.trim() !== '') {
        noteStatus = 'completed';
      }

      // Ensure the status is one of the allowed values
      const validStatus: Note['status'] = 
        ['pending', 'processing', 'transcribing', 'completed', 'error'].includes(noteStatus) 
          ? noteStatus as Note['status']
          : 'processing';

      // Prioritize the note's own duration, but fall back to recording duration if needed
      const duration = data.duration !== null && data.duration > 0 
        ? data.duration 
        : recordingData?.duration || null;

      const transformedNote: Note = {
        id: data.id,
        title: data.title,
        processed_content: data.processed_content,
        original_transcript: noteTranscript,
        full_prompt: data.full_prompt,
        created_at: data.created_at,
        updated_at: data.updated_at,
        recording_id: data.recording_id,
        user_id: data.user_id,
        duration: duration,
        audio_url: data.audio_url || null,
        status: validStatus,
        processing_progress: data.processing_progress || 0,
        error_message: data.error_message || null
      };

      // If the note should be completed but isn't, update it
      if (validStatus === 'completed' && data.status !== 'completed') {
        try {
          await supabase
            .from('notes')
            .update({ 
              status: 'completed',
              processing_progress: 100 
            })
            .eq('id', data.id);
            
          console.log("Updated note status to completed");
        } catch (error) {
          console.error("Error updating note status:", error);
        }
      }

      return transformedNote;
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: isValidNoteId && !!noteId,
  });

  const { data: tags } = useQuery({
    queryKey: ["note-tags", noteId],
    queryFn: async () => {
      if (!noteId || !isValidNoteId) return [];
      
      console.log("Fetching tags for note:", noteId);
      const { data, error } = await supabase
        .from("tags")
        .select("*, notes_tags!inner(note_id)")
        .eq("notes_tags.note_id", noteId);

      if (error) throw error;
      return data;
    },
    enabled: !!noteId && isValidNoteId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Remove folders & notes_folders queries
  // Only use projects & notes_projects

  const { data: currentProject } = useQuery({
    queryKey: ["note-project", noteId],
    queryFn: async () => {
      if (!noteId || !isValidNoteId) return null;
      
      console.log("Fetching current project for note:", noteId);
      const { data, error } = await supabase
        .from("projects")
        .select("*, notes_projects!inner(*)")
        .eq("notes_projects.note_id", noteId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching project:", error);
        throw error;
      }
      return data;
    },
    enabled: !!noteId && isValidNoteId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!noteId || !isValidNoteId) return [];
      
      console.log("Fetching projects");
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!noteId && isValidNoteId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  return {
    note,
    isLoadingNote,
    tags,
    projects,
    currentProject
  };
};
