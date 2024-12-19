import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedNotes: string[];
  onToggleNoteSelection: (noteId: string) => void;
}

export const NoteList = ({
  notes,
  isLoading,
  isSelectionMode,
  selectedNotes,
  onToggleNoteSelection,
}: NoteListProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-lg border border-dashed border-gray-300">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No notes</h3>
          <p className="text-sm text-gray-500 mb-4">
            Get started by creating a new note.
          </p>
          <Button
            className="bg-[#E91E63] hover:bg-[#D81B60]"
            onClick={() => navigate("/record")}
          >
            + New Note
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`bg-white p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow relative ${
            isSelectionMode ? "cursor-pointer" : ""
          }`}
          onClick={() =>
            isSelectionMode
              ? onToggleNoteSelection(note.id)
              : navigate(`/app/notes/${note.id}`)
          }
        >
          {isSelectionMode && (
            <div className="absolute top-4 right-4">
              <input
                type="checkbox"
                checked={selectedNotes.includes(note.id)}
                onChange={() => onToggleNoteSelection(note.id)}
                className="h-4 w-4"
              />
            </div>
          )}
          <h3 className="font-medium mb-2">{note.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-3">{note.content}</p>
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