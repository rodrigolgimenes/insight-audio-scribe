
import { useState } from "react";
import { MeetingMinutes } from "./MeetingMinutes";
import { Note } from "@/types/notes";
import { TranscriptChat } from "./TranscriptChat";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptionStatus } from "./TranscriptionStatus";

interface NoteContentProps {
  note: Note;
  audioUrl: string | null;
  meetingMinutes?: string | null;
  isLoadingMinutes?: boolean;
}

export const NoteContent = ({ 
  note, 
  audioUrl, 
  meetingMinutes, 
  isLoadingMinutes 
}: NoteContentProps) => {
  return (
    <div className="space-y-8">
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
