import { Note } from "@/integrations/supabase/types/notes";

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
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div key={note.id} className="border rounded p-4">
          <h3 className="text-lg font-semibold">{note.title}</h3>
          <div className="mt-2 text-gray-600 line-clamp-2">
            {note.processed_content}
          </div>
          {isSelectionMode && (
            <button
              onClick={() => onSelect(note)}
              className={`mt-2 text-sm ${selectedNotes.includes(note) ? 'text-blue-500' : 'text-gray-500'}`}
            >
              {selectedNotes.includes(note) ? 'Deselect' : 'Select'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};