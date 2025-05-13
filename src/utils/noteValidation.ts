
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export const isValidNoteId = (noteId: string | undefined): boolean => {
  if (!noteId) return false;
  
  // UUID validation regex
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noteId);
};

export const useNoteValidation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateNoteId = (noteId: string | undefined): boolean => {
    if (!noteId) {
      console.error("No note ID provided");
      toast({
        title: "Missing Note ID",
        description: "No note ID was provided. Redirecting to dashboard.",
        variant: "destructive",
      });
      navigate("/app");
      return false;
    }
    
    if (!isValidNoteId(noteId)) {
      console.error("Invalid note ID format:", noteId);
      toast({
        title: "Invalid Note ID",
        description: "The note you're trying to access has an invalid format.",
        variant: "destructive",
      });
      navigate("/app");
      return false;
    }
    
    return true;
  };

  return { validateNoteId };
};
