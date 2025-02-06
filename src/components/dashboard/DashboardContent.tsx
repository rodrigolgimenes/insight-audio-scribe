import { Note } from "@/integrations/supabase/types/notes";
import { useNavigate } from "react-router-dom";
import { NotesGrid } from "./NotesGrid";
import { EmptyState } from "./EmptyState";
import { BulkActions } from "./BulkActions";
import { FolderDialog } from "./FolderDialog";

interface DashboardContentProps {
  notes: Note[] | undefined;
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedNotes: Note[];
  isFolderDialogOpen: boolean;
  setIsFolderDialogOpen: (value: boolean) => void;
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  onCreateNewFolder: () => Promise<void>;
  onMoveToFolder: (folderId: string) => Promise<void>;
  onDeleteNotes: () => Promise<void>;
  onNoteSelect: (note: Note) => void;
}

export const DashboardContent = ({
  notes,
  isLoading,
  isSelectionMode,
  selectedNotes,
  isFolderDialogOpen,
  setIsFolderDialogOpen,
  newFolderName,
  setNewFolderName,
  onCreateNewFolder,
  onMoveToFolder,
  onDeleteNotes,
  onNoteSelect,
}: DashboardContentProps) => {
  const navigate = useNavigate();

  const handleNoteClick = (note: Note) => {
    if (isSelectionMode) {
      onNoteSelect(note);
    } else {
      navigate(`/app/notes/${note.id}`);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isSelectionMode && selectedNotes.length > 0 && (
        <BulkActions
          selectedNotes={selectedNotes}
          onMoveToFolder={() => setIsFolderDialogOpen(true)}
          onDelete={onDeleteNotes}
        />
      )}

      {notes && notes.length > 0 ? (
        <NotesGrid
          notes={notes}
          isSelectionMode={isSelectionMode}
          selectedNotes={selectedNotes}
          onNoteClick={handleNoteClick}
          onNoteSelect={onNoteSelect}
        />
      ) : (
        <EmptyState />
      )}

      <FolderDialog
        isOpen={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        folders={[]}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateNewFolder={onCreateNewFolder}
        onSelectFolder={onMoveToFolder}
      />
    </>
  );
};