
import { FolderNotesGrid } from "@/components/folder/FolderNotesGrid";
import { FolderEmptyState } from "@/components/folder/FolderEmptyState";
import { BulkActions } from "@/components/dashboard/BulkActions";
import { FolderDialog } from "@/components/dashboard/FolderDialog";
import { Note } from "@/types/notes";

interface UncategorizedContentProps {
  isLoading: boolean;
  notes: Note[] | undefined;
  isSelectionMode: boolean;
  selectedNotes: Note[];
  toggleNoteSelection: (noteId: string) => void;
  isFolderDialogOpen: boolean;
  setIsFolderDialogOpen: (value: boolean) => void;
  folders: any[];
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  createNewFolder: () => Promise<void>;
  handleSelectFolder: (folderId: string) => Promise<void>;
  handleMoveNotes: () => void;
  handleDeleteNotes: (notes: Note[]) => void;
}

export const UncategorizedContent = ({
  isLoading,
  notes,
  isSelectionMode,
  selectedNotes,
  toggleNoteSelection,
  isFolderDialogOpen,
  setIsFolderDialogOpen,
  folders,
  newFolderName,
  setNewFolderName,
  createNewFolder,
  handleSelectFolder,
  handleMoveNotes,
  handleDeleteNotes,
}: UncategorizedContentProps) => {
  return (
    <>
      {isSelectionMode && selectedNotes.length > 0 && (
        <BulkActions
          selectedCount={selectedNotes.length}
          onExport={() => setIsFolderDialogOpen(true)}
          onMove={handleMoveNotes}
          onDelete={() => handleDeleteNotes(selectedNotes)}
        />
      )}

      {isLoading ? (
        <div>Loading...</div>
      ) : notes && notes.length > 0 ? (
        <FolderNotesGrid
          notes={notes}
          isSelectionMode={isSelectionMode}
          selectedNotes={selectedNotes.map(note => note.id)}
          toggleNoteSelection={toggleNoteSelection}
        />
      ) : (
        <FolderEmptyState />
      )}

      <FolderDialog
        isOpen={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        folders={folders}
        currentFolderId={null}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateNewFolder={createNewFolder}
        onSelectFolder={handleSelectFolder}
      />
    </>
  );
};
