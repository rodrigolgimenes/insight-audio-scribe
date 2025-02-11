
import { FolderNoteCard } from "./FolderNoteCard";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  original_transcript: string | null;
  created_at: string;
  duration: number | null;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {notes.map((note) => (
        <FolderNoteCard
          key={note.id}
          note={note}
          isSelectionMode={isSelectionMode}
          isSelected={selectedNotes.includes(note.id)}
          onClick={() => navigate(`/app/notes/${note.id}`)}
          onToggleSelection={() => toggleNoteSelection(note.id)}
        />
      ))}
    </div>
  );
};
