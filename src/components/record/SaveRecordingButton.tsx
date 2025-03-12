
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SaveRecordingButtonProps {
  onSave: () => void;
  isSaving: boolean;
  isDisabled: boolean;
}

export const SaveRecordingButton = ({ onSave, isSaving, isDisabled }: SaveRecordingButtonProps) => {
  const [isClickable, setIsClickable] = useState(true);

  useEffect(() => {
    if (!isSaving) {
      // Reset clickable state after saving completes
      setIsClickable(true);
    }
  }, [isSaving]);

  const handleClick = () => {
    if (!isClickable || isDisabled || isSaving) return;
    
    setIsClickable(false); // Prevent double clicks
    onSave();
  };

  return (
    <Button 
      className="bg-[#9b87f5] hover:bg-[#7E69AB] active:bg-[#7E69AB] text-white gap-2 w-full max-w-[220px] rounded-md"
      onClick={handleClick}
      disabled={!isClickable || isDisabled || isSaving}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Transcribing...</span>
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          <span>Transcribe Now</span>
        </>
      )}
    </Button>
  );
};
