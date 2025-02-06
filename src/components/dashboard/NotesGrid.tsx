import { Note } from "@/integrations/supabase/types/notes";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`bg-white p-6 rounded-xl border hover:shadow-lg transition-all duration-200 relative ${
            selectedNotes.includes(note)
              ? "border-primary ring-2 ring-primary/20"
              : "border-gray-200"
          }`}
          onClick={() => onNoteClick(note)}
        >
          {isSelectionMode && (
            <div className="absolute top-4 right-4">
              <input
                type="checkbox"
                checked={selectedNotes.includes(note)}
                onChange={() => onNoteSelect(note)}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                {note.title}
              </h3>
              {note.original_transcript ? (
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {note.original_transcript}
                </p>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    No transcript available
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Note
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>
            {!isSelectionMode && (
              <Button
                variant="destructive"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle delete
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};