
import { useState } from "react";
import { Note } from "@/integrations/supabase/types/notes";

export const useNoteSelection = () => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);

  const toggleNoteSelection = (note: Note) => {
    setSelectedNotes((prev) =>
      prev.includes(note)
        ? prev.filter((n) => n.id !== note.id)
        : [...prev, note]
    );
  };

  return {
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    setSelectedNotes,
    toggleNoteSelection,
  };
};
