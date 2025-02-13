
import { useState } from "react";
import { MeetingMinutes } from "./MeetingMinutes";
import { Note } from "@/integrations/supabase/types/notes";
import { TranscriptChat } from "./TranscriptChat";
import { TranscriptAccordion } from "./TranscriptAccordion";

interface NoteContentProps {
  note: Note;
  meetingMinutes?: string | null;
}

export const NoteContent = ({ note, meetingMinutes }: NoteContentProps) => {
  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
        <p className="text-gray-500 mt-1">
          {new Date(note.created_at).toLocaleDateString('pt-BR', {
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
        audioUrl={note.audio_url}
        initialContent={meetingMinutes}
      />

      <TranscriptAccordion transcript={note.original_transcript} />

      <TranscriptChat note={note} />
    </div>
  );
};
