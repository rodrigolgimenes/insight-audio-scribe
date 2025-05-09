
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
    projects, 
    currentProject, 
    tags 
  } = useNoteFetching(noteId, isValidNoteId);
  
  const { retryTranscription } = useNoteTranscription();

  // Map projects to folders and currentProject to currentFolder for backward compatibility
  const folders = projects;
  const currentFolder = currentProject;

  return {
    note,
    isLoadingNote,
    folders, // Map projects to folders for backward compatibility
    currentFolder, // Map currentProject to currentFolder for backward compatibility
    tags,
    retryTranscription
  };
};
