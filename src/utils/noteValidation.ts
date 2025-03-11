
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export const isValidNoteId = (noteId: string | undefined): boolean => {
  if (!noteId) return false;
  
  // UUID validation regex
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(noteId);
};

export const useNoteValidation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateNoteId = (noteId: string | undefined): boolean => {
    if (!isValidNoteId(noteId)) {
      toast({
        title: "Invalid Note ID",
        description: "The note you're trying to access doesn't exist.",
        variant: "destructive",
      });
      navigate("/app");
      return false;
    }
    return true;
  };

  return { validateNoteId };
};
