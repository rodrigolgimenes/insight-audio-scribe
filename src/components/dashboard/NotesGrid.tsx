
import { Note } from "@/integrations/supabase/types/notes";
import { NoteCard } from "./NoteCard";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface NotesGridProps {
  notes: Note[];
  isSelectionMode: boolean;
  selectedNotes: Note[];
  onNoteClick: (note: Note) => void;
  onDeleteSelected?: () => void;
}

export const NotesGrid = ({ 
  notes, 
  isSelectionMode, 
  selectedNotes, 
  onNoteClick,
  onDeleteSelected
}: NotesGridProps) => {
  if (!notes || notes.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {isSelectionMode && selectedNotes.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selectedNotes.length} notes selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete selected
          </Button>
        </div>
      )}
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
    </>
  );
};
