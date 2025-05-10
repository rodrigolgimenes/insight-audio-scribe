
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
    tags,
    projects,
    currentProject
  } = useNoteFetching(noteId, isValidNoteId);
  
  const { retryTranscription } = useNoteTranscription();

  return {
    note,
    isLoadingNote,
    tags,
    retryTranscription,
    projects,
    currentProject
  };
};
