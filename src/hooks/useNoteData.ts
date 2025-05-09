
import { useParams } from "react-router-dom";
import { useNoteValidation } from "@/utils/noteValidation";
import { useNoteFetching } from "@/hooks/notes/useNoteFetching";
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";

export const useNoteData = () => {
  const { noteId } = useParams();
  const { validateNoteId } = useNoteValidation();
  const isValidNoteId = validateNoteId(noteId);
  
  const { 
    note, 
    isLoadingNote, 
    folders,
    currentFolder,
    tags,
    projects,    // Add projects
    currentProject // Add currentProject
  } = useNoteFetching(noteId, isValidNoteId);
  
  const { retryTranscription } = useNoteTranscription();

  return {
    note,
    isLoadingNote,
    folders,
    currentFolder,
    tags,
    retryTranscription,
    projects,    // Return projects
    currentProject // Return currentProject
  };
};
