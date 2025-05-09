
import { ProjectNoteCard } from "./ProjectNoteCard";
import { useNavigate } from "react-router-dom";
import { Note } from "@/integrations/supabase/types/notes";

interface ProjectNotesGridProps {
  notes: Note[];
  isSelectionMode: boolean;
  selectedNotes: string[];
  toggleNoteSelection: (noteId: string) => void;
}

export const ProjectNotesGrid = ({
  notes,
  isSelectionMode,
  selectedNotes,
  toggleNoteSelection,
}: ProjectNotesGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => (
        <ProjectNoteCard
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
