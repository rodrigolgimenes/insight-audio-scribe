import { Note } from "@/integrations/supabase/types/notes";
import { useNavigate } from "react-router-dom";

interface NoteListProps {
  notes: Note[];
  onSelect: (note: Note) => void;
  selectedNotes: Note[];
  isLoading?: boolean;
  isSelectionMode?: boolean;
}

export const NoteList = ({ 
  notes, 
  onSelect, 
  selectedNotes,
  isLoading = false,
  isSelectionMode = false 
}: NoteListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleNoteClick = (note: Note, event: React.MouseEvent) => {
    if (isSelectionMode) {
      onSelect(note);
    } else {
      navigate(`/app/notes/${note.id}`);
    }
  };

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div 
          key={note.id} 
          className={`border rounded p-4 cursor-pointer transition-all hover:shadow-md ${
            selectedNotes.includes(note) ? 'border-blue-500 bg-blue-50' : ''
          }`}
          onClick={(e) => handleNoteClick(note, e)}
        >
          <h3 className="text-lg font-semibold">{note.title}</h3>
          <div className="mt-2 text-gray-600 line-clamp-2">
            {note.processed_content}
          </div>
          {isSelectionMode && (
            <div className="mt-2 flex justify-end">
              <input
                type="checkbox"
                checked={selectedNotes.includes(note)}
                onChange={() => onSelect(note)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
