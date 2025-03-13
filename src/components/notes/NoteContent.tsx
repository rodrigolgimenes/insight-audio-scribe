
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { Note } from "@/types/notes";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TranscriptionStatus } from "./transcription/TranscriptionStatus";
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
  const [isRetrying, setIsRetrying] = useState(false);
  const [fromUpload, setFromUpload] = useState(false);
  const queryClient = useQueryClient();
  
  // Refresh data on mount to ensure we have the latest status
  useEffect(() => {
    if (note.id) {
      queryClient.invalidateQueries({ queryKey: ['note', note.id] });
    }
  }, [note.id, queryClient]);
  
  // Check if we need to auto-retry based on URL params
  useEffect(() => {
    const checkAndAutoRetry = async () => {
      // Check if this is a new file upload (status is pending and no transcription)
      if ((note.status === 'pending') && 
          !note.original_transcript && 
          !isRetrying) {
        
        console.log("Auto-retrying transcription for newly uploaded file:", note.id);
        setIsRetrying(true);
        setFromUpload(true);
        
        try {
          await retryTranscription(note.id);
          console.log("Auto-retry transcription initiated successfully");
        } catch (error) {
          console.error("Failed to auto-retry transcription:", error);
        } finally {
          setIsRetrying(false);
        }
      }
    };
    
    if (note.id) {
      checkAndAutoRetry();
    }
  }, [note.id, note.status, note.original_transcript, retryTranscription]);

  // Check for inconsistent state and fix it
  useEffect(() => {
    const fixInconsistentState = async () => {
      // If status is 'completed' but transcript is missing or vice versa
      if (note.id && 
          ((note.status === 'completed' && !note.original_transcript) ||
           (note.status !== 'completed' && note.original_transcript))) {
        
        console.log("Fixing inconsistent state for note:", note.id);
        
        try {
          // Check recording for transcript
          const { data: recording } = await supabase
            .from('recordings')
            .select('transcription')
            .eq('id', note.recording_id)
            .single();
            
          if (recording?.transcription && !note.original_transcript) {
            // Update note with transcript from recording
            await supabase
              .from('notes')
              .update({
                original_transcript: recording.transcription,
                status: 'completed',
                processing_progress: 100
              })
              .eq('id', note.id);
              
            queryClient.invalidateQueries({ queryKey: ['note', note.id] });
          } else if (note.original_transcript && note.status !== 'completed') {
            // Update status to match transcript
            await supabase
              .from('notes')
              .update({
                status: 'completed',
                processing_progress: 100
              })
              .eq('id', note.id);
              
            queryClient.invalidateQueries({ queryKey: ['note', note.id] });
          }
        } catch (error) {
          console.error("Error fixing inconsistent state:", error);
        }
      }
    };
    
    if (note.id) {
      fixInconsistentState();
    }
  }, [note.id, note.status, note.original_transcript, note.recording_id, queryClient]);

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
          // Immediately invalidate queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['note', note.id] });
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up channel subscription');
      supabase.removeChannel(noteChannel);
    };
  }, [note.id, queryClient]);

  const handleRetryTranscription = async () => {
    if (note.id) {
      setIsRetrying(true);
      try {
        await retryTranscription(note.id);
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const showRetryButton = (note.status === 'error' || (note.status === 'completed' && !note.original_transcript)) && !fromUpload;

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
