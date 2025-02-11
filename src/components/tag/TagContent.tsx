
import { FolderNotesGrid } from "@/components/folder/FolderNotesGrid";
import { FolderEmptyState } from "@/components/folder/FolderEmptyState";
import { Note } from "@/types/notes";

interface TagContentProps {
  notes: Note[] | undefined;
  isSelectionMode: boolean;
  selectedNotes: string[];
  toggleNoteSelection: (noteId: string) => void;
}

export function TagContent({
  notes,
  isSelectionMode,
  selectedNotes,
  toggleNoteSelection,
}: TagContentProps) {
  return notes && notes.length > 0 ? (
    <FolderNotesGrid
      notes={notes}
      isSelectionMode={isSelectionMode}
      selectedNotes={selectedNotes}
      toggleNoteSelection={toggleNoteSelection}
    />
  ) : (
    <FolderEmptyState />
  );
}
