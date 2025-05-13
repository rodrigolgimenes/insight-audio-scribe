
import React from "react";
import { TranscriptAccordion } from "../TranscriptAccordion";
import { TranscriptChat } from "../TranscriptChat";
import { Note } from "@/types/notes";

interface TranscriptSectionProps {
  note: Note;
}

export const TranscriptSection: React.FC<TranscriptSectionProps> = ({ note }) => {
  return (
    <div className="w-full space-y-8">
      <TranscriptAccordion 
        transcript={note.original_transcript} 
        noteId={note.id}
      />
      <div className="w-full">
        <TranscriptChat note={note} />
      </div>
    </div>
  );
};
