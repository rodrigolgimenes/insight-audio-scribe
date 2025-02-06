import { Note } from "@/integrations/supabase/types/notes";
import { NoteCard } from "./NoteCard";
import { EmptyState } from "./EmptyState";

interface NotesGridProps {
  notes: Note[];
  isSelectionMode: boolean;
  selectedNotes: Note[];
  onNoteClick: (note: Note) => void;
}

export const NotesGrid = ({ 
  notes, 
  isSelectionMode, 
  selectedNotes, 
  onNoteClick 
}: NotesGridProps) => {
  if (!notes || notes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isSelectionMode={isSelectionMode}
          isSelected={selectedNotes.includes(note)}
          onClick={() => onNoteClick(note)}
        />
      ))}
    </div>
  );
};