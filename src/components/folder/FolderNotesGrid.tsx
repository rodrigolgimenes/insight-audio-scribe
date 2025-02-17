
import { FolderNoteCard } from "./FolderNoteCard";
import { useNavigate } from "react-router-dom";
import { Note } from "@/integrations/supabase/types/notes";

interface FolderNotesGridProps {
  notes: Note[];
  isSelectionMode: boolean;
  selectedNotes: string[];
  toggleNoteSelection: (noteId: string) => void;
}

export const FolderNotesGrid = ({
  notes,
  isSelectionMode,
  selectedNotes,
  toggleNoteSelection,
}: FolderNotesGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => (
        <FolderNoteCard
          key={note.id}
          note={{
            id: note.id,
            title: note.title,
            original_transcript: note.original_transcript,
            created_at: note.created_at,
            duration: note.duration || 0,
            tags: note.tags || []
          }}
          isSelectionMode={isSelectionMode}
          isSelected={selectedNotes.includes(note.id)}
          onClick={() => navigate(`/app/notes/${note.id}`)}
          onToggleSelection={() => toggleNoteSelection(note.id)}
        />
      ))}
    </div>
  );
};
