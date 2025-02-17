
import { useState } from "react";
import { useNoteManagement } from "@/hooks/useNoteManagement";
import { useFolderNotesQuery } from "@/hooks/folder/useFolderNotesQuery";
import { NotesTable } from "@/components/dashboard/NotesTable";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { UncategorizedHeader } from "./UncategorizedHeader";
import { UncategorizedEmptyState } from "./UncategorizedEmptyState";
import { Note } from "@/integrations/supabase/types/notes";

export const UncategorizedContent = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: notes,
    isLoading,
    error,
  } = useFolderNotesQuery(null);

  const {
    selectedNotes,
    toggleNoteSelection,
    toggleSelectAll,
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    handleDeleteNotes,
  } = useNoteManagement();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading notes</div>;
  }

  if (!notes || notes.length === 0) {
    return <UncategorizedEmptyState />;
  }

  const filteredNotes = notes.filter((note: Note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-0 flex-1 flex flex-col">
      <UncategorizedHeader 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />
      <div className="flex-1 overflow-auto">
        <div className="px-4">
          <NotesTable
            notes={filteredNotes}
            selectedNotes={selectedNotes}
            onSelectAll={() => toggleSelectAll(filteredNotes)}
            toggleNoteSelection={toggleNoteSelection}
          />
        </div>
      </div>

      {selectedNotes.length > 0 && (
        <div className="fixed bottom-0 left-[280px] right-0">
          <BulkActions
            selectedCount={selectedNotes.length}
            selectedIds={selectedNotes.map(note => note.id)}
            onMove={() => setIsFolderDialogOpen(true)}
            onDelete={handleDeleteNotes}
          />
        </div>
      )}
    </div>
  );
};
