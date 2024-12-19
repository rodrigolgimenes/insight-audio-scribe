import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface RecordActionsProps {
  onSave: () => void;
  isSaving: boolean;
  isRecording: boolean;
}

export const RecordActions = ({ onSave, isSaving, isRecording }: RecordActionsProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="outline" className="gap-2 border-2 text-primary">
        <Settings className="w-4 h-4" />
        Settings
      </Button>
      <Button 
        className="bg-[#E91E63] hover:bg-[#D81B60] gap-2"
        onClick={onSave}
        disabled={!isRecording || isSaving}
      >
        {isSaving ? 'Saving...' : 'Create note'}
      </Button>
    </div>
  );
};