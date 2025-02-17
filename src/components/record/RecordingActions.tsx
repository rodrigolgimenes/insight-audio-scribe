
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

interface RecordingActionsProps {
  onSave: () => void;
  isSaving: boolean;
  isLoading: boolean;
}

export const RecordingActions = ({ 
  onSave, 
  isSaving, 
  isLoading
}: RecordingActionsProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <SaveRecordingButton 
          onSave={onSave}
          isSaving={isSaving}
          isDisabled={isLoading}
        />
      </div>
    </div>
  );
};
