
import { useRenameNote } from "./operations/useRenameNote";
import { useMoveNote } from "./operations/useMoveNote";
import { useNoteTag } from "./operations/useNoteTag";
import { useDeleteNote } from "./operations/useDeleteNote";

export const useNoteOperations = (noteId: string) => {
  const { renameNote, isRenaming } = useRenameNote(noteId);
  const { moveNoteToProject } = useMoveNote(noteId);
  const { addTagToNote } = useNoteTag(noteId);
  const { deleteNote } = useDeleteNote(noteId);

  return {
    renameNote,
    isRenaming,
    moveNoteToProject,
    addTagToNote,
    deleteNote,
  };
};
