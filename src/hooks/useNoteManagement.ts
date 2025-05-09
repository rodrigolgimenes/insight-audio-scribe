
import { useNotesQuery } from "./notes/useNotesQuery";
import { useNoteSelection } from "./notes/useNoteSelection";
import { useProjectActions } from "./notes/useProjectActions";
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
    isProjectDialogOpen,
    setIsProjectDialogOpen,
    newProjectName,
    setNewProjectName,
    createNewProject,
    handleMoveToProject,
  } = useProjectActions();
  const { handleDeleteNotes } = useNoteActions();

  return {
    notes,
    isLoading,
    error,
    isSelectionMode,
    setIsSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    isProjectDialogOpen,
    setIsProjectDialogOpen,
    newProjectName,
    setNewProjectName,
    createNewProject,
    handleMoveToProject: (projectId: string) => handleMoveToProject(selectedNotes, projectId),
    handleDeleteNotes: () => handleDeleteNotes(selectedNotes).then(() => {
      setIsSelectionMode(false);
      setSelectedNotes([]);
    }),
  };
};
