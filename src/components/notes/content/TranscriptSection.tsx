
import React from "react";
import { TranscriptAccordion } from "../TranscriptAccordion";
import { TranscriptChat } from "../TranscriptChat";
import { Note } from "@/types/notes";

interface TranscriptSectionProps {
  note: Note;
}

export const TranscriptSection: React.FC<TranscriptSectionProps> = ({ note }) => {
  return (
    <>
      <TranscriptAccordion 
        transcript={note.original_transcript} 
        noteId={note.id}
      />
      <TranscriptChat note={note} />
    </>
  );
};
