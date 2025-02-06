import { Note } from "@/integrations/supabase/types/notes";
import { TitleSection } from "./TitleSection";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";

interface NoteContentProps {
  note: Note;
}

export const NoteContent = ({ note }: NoteContentProps) => {
  return (
    <div className="space-y-8">
      <TitleSection note={note} />
      <TranscriptAccordion transcript={note.original_transcript} />
      <TranscriptChat note={note} />
    </div>
  );
};