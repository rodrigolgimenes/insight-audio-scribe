
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
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
      className="bg-[#E91E63] hover:bg-[#D81B60] gap-2 min-w-[140px]"
      onClick={handleClick}
      disabled={!isClickable || isDisabled || isSaving}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Creating...</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          <span>Create Note</span>
        </>
      )}
    </Button>
  );
};
