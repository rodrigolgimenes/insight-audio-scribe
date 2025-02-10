
import { useNotesQuery } from "./notes/useNotesQuery";
import { useNoteSelection } from "./notes/useNoteSelection";
import { useFolderActions } from "./notes/useFolderActions";
import { useNoteActions } from "./notes/useNoteActions";

export const useNoteManagement = () => {
  const { data: notes, isLoading, error } = useNotesQuery();
  const {
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    setSelectedNotes,
    toggleNoteSelection,
  } = useNoteSelection();
  const {
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    createNewFolder,
    handleMoveToFolder,
  } = useFolderActions();
  const { handleDeleteNotes } = useNoteActions();

  return {
    notes,
    isLoading,
    error,
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    isFolderDialogOpen,
    setIsFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    createNewFolder,
    handleMoveToFolder: (folderId: string) => handleMoveToFolder(selectedNotes, folderId),
    handleDeleteNotes: () => handleDeleteNotes(selectedNotes).then(() => {
      setIsSelectionMode(false);
      setSelectedNotes([]);
    }),
  };
};
