
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";

interface SaveRecordingButtonProps {
  onSave: () => void;
  isSaving: boolean;
  isDisabled: boolean;
}

export const SaveRecordingButton = ({ onSave, isSaving, isDisabled }: SaveRecordingButtonProps) => {
  return (
    <Button 
      className="bg-[#E91E63] hover:bg-[#D81B60] gap-2 min-w-[140px]"
      onClick={onSave}
      disabled={isDisabled || isSaving}
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
