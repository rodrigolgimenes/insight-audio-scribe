
import { useState } from "react";
import { Note } from "@/integrations/supabase/types/notes";

export const useNoteSelection = () => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);

  const toggleNoteSelection = (note: Note) => {
    setSelectedNotes((prev) =>
      prev.some((n) => n.id === note.id)
        ? prev.filter((n) => n.id !== note.id)
        : [...prev, note]
    );
  };

  const toggleSelectAll = (notes: Note[] | undefined) => {
    if (!notes) return;
    
    if (selectedNotes.length === notes.length) {
      // If all notes are selected, deselect all
      setSelectedNotes([]);
      setIsSelectionMode(false);
    } else {
      // If not all notes are selected, select all
      setSelectedNotes(notes);
      setIsSelectionMode(true);
    }
  };

  return {
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    setSelectedNotes,
    toggleNoteSelection,
    toggleSelectAll,
  };
};
