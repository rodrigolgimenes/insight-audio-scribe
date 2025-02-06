import { Note } from "@/integrations/supabase/types/notes";
import { Badge } from "@/components/ui/badge";

interface NotesGridProps {
  notes: Note[];
  isSelectionMode: boolean;
  selectedNotes: Note[];
  onNoteClick: (note: Note) => void;
  onNoteSelect: (note: Note) => void;
}

export const NotesGrid = ({
  notes,
  isSelectionMode,
  selectedNotes,
  onNoteClick,
  onNoteSelect,
}: NotesGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="bg-white p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow relative"
          onClick={() => onNoteClick(note)}
        >
          {isSelectionMode && (
            <div className="absolute top-4 right-4">
              <input
                type="checkbox"
                checked={selectedNotes.includes(note)}
                onChange={() => onNoteSelect(note)}
                className="h-4 w-4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <h3 className="font-medium mb-2">{note.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">
            {note.original_transcript || "No transcript available"}
          </p>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {new Date(note.created_at).toLocaleDateString()}
            </span>
            <Badge>Note</Badge>
          </div>
        </div>
      ))}
    </div>
  );
};