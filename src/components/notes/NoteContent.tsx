import { Note } from "@/integrations/supabase/types/notes";
import { TitleSection } from "./TitleSection";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptChat } from "./TranscriptChat";
import { MeetingMinutes } from "./MeetingMinutes";

interface NoteContentProps {
  note: Note;
}

export const NoteContent = ({ note }: NoteContentProps) => {
  return (
    <div className="space-y-8">
      <TitleSection note={note} />
      <MeetingMinutes transcript={note.original_transcript} noteId={note.id} />
      <TranscriptAccordion transcript={note.original_transcript} />
      <TranscriptChat note={note} />
    </div>
  );
};