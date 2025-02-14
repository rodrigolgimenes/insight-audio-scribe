
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface SaveRecordingButtonProps {
  onSave: () => void;
  isSaving: boolean;
  isDisabled: boolean;
}

export const SaveRecordingButton = ({ onSave, isSaving, isDisabled }: SaveRecordingButtonProps) => {
  return (
    <Button 
      className="bg-[#E91E63] hover:bg-[#D81B60] gap-2"
      onClick={onSave}
      disabled={isDisabled}
    >
      <Mic className="w-4 h-4" />
      {isSaving ? 'Saving...' : 'Create Note'}
    </Button>
  );
};
