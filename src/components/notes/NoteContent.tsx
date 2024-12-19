import { Note } from "@/integrations/supabase/types/notes";

interface NoteContentProps {
  note: Note;
}

export const NoteContent = ({ note }: NoteContentProps) => {
  return (
    <div className="prose max-w-none">
      <div dangerouslySetInnerHTML={{ __html: note.processed_content }} />
    </div>
  );
};