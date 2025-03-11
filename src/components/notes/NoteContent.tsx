
import { Button } from "@/components/ui/button";
import { useNoteData } from "@/hooks/useNoteData";
import { RefreshCcw } from "lucide-react";
import { Note } from "@/types/notes";
import { MeetingMinutes } from "./MeetingMinutes";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";
import { TranscriptionStatus } from "./TranscriptionStatus";

interface NoteContentProps {
  note: Note;
  audioUrl: string | null;
  meetingMinutes: string | null;
  isLoadingMinutes: boolean;
}

export const NoteContent = ({ note, audioUrl, meetingMinutes, isLoadingMinutes }: NoteContentProps) => {
  const { retryTranscription } = useNoteData();

  const handleRetryTranscription = async () => {
    if (note.id) {
      await retryTranscription(note.id);
    }
  };

  const showRetryButton = note.status === 'error' || (note.status === 'completed' && !note.original_transcript);

  return (
    <div className="space-y-8">
      {showRetryButton && (
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
          onClick={handleRetryTranscription}
        >
          <RefreshCcw className="h-4 w-4" />
          Retry Transcription
        </Button>
      )}
      
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
        <p className="text-gray-500 mt-1">
          {new Date(note.created_at).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <MeetingMinutes
        noteId={note.id}
        transcript={note.original_transcript}
        audioUrl={audioUrl}
        initialContent={meetingMinutes}
        isLoadingInitialContent={isLoadingMinutes}
      />

      <TranscriptAccordion transcript={note.original_transcript} />

      <TranscriptChat note={note} />

      <TranscriptionStatus 
        status={note.status} 
        progress={note.processing_progress || 0} 
        error={note.error_message}
        duration={note.duration}
      />
    </div>
  );
};
