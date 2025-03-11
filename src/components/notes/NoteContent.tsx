
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { Note } from "@/types/notes";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { TranscriptionStatus } from "./TranscriptionStatus";
import { MeetingMinutesSection } from "./content/MeetingMinutesSection";
import { TranscriptSection } from "./content/TranscriptSection";
import { RetryTranscriptionButton } from "./content/RetryTranscriptionButton";
import { NoteHeader as ContentHeader } from "./content/NoteHeader";

interface NoteContentProps {
  note: Note;
  audioUrl: string | null;
  meetingMinutes: string | null;
  isLoadingMinutes: boolean;
}

export const NoteContent = ({ note, audioUrl, meetingMinutes, isLoadingMinutes }: NoteContentProps) => {
  const { retryTranscription } = useNoteTranscription();

  // Set up realtime channel for status updates
  useEffect(() => {
    if (!note.id) return;
    
    // Subscribe to status updates
    const noteChannel = supabase
      .channel(`note-status-${note.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `id=eq.${note.id}`
        },
        (payload) => {
          console.log('Received note update:', payload);
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up channel subscription');
      supabase.removeChannel(noteChannel);
    };
  }, [note.id]);

  const handleRetryTranscription = async () => {
    if (note.id) {
      await retryTranscription(note.id);
    }
  };

  const showRetryButton = note.status === 'error' || (note.status === 'completed' && !note.original_transcript);

  return (
    <div className="space-y-8">
      {showRetryButton && (
        <RetryTranscriptionButton onRetry={handleRetryTranscription} />
      )}
      
      <ContentHeader title={note.title} createdAt={note.created_at} />

      <MeetingMinutesSection
        noteId={note.id}
        transcript={note.original_transcript}
        audioUrl={audioUrl}
        meetingMinutes={meetingMinutes}
        isLoadingMinutes={isLoadingMinutes}
      />

      <TranscriptSection note={note} />

      <TranscriptionStatus 
        status={note.status} 
        progress={note.processing_progress || 0} 
        error={note.error_message}
        duration={note.duration}
        noteId={note.id}
        transcript={note.original_transcript}
      />
    </div>
  );
};
