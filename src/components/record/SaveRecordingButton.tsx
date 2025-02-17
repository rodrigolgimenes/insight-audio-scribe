
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
      setIsClickable(true);
    }
  }, [isSaving]);

  const handleClick = () => {
    if (!isClickable || isDisabled || isSaving) return;
    setIsClickable(false);
    onSave();
  };

  return (
    <Button 
      className="bg-primary hover:bg-primary-dark gap-2 min-w-[140px] text-white"
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
