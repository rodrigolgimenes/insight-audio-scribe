
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Save, Loader2 } from "lucide-react";

interface RecordingActionsProps {
  onSave: () => void;
  isSaving: boolean;
  isLoading: boolean;
  isRecording: boolean;
  hasRecording: boolean;
  processingProgress?: number;
  processingStage?: string;
  isDisabled?: boolean;
}

export const RecordingActions: React.FC<RecordingActionsProps> = ({
  onSave,
  isSaving,
  isLoading,
  isRecording,
  hasRecording,
  processingProgress = 0,
  processingStage = "",
  isDisabled = false
}) => {
  return (
    <div className="mt-4">
      <Button
        onClick={onSave}
        disabled={isRecording || !hasRecording || isSaving || isLoading || isDisabled}
        className="w-full bg-blue-500 hover:bg-blue-600 transition-colors"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Recording
          </>
        )}
      </Button>
      
      {isSaving && processingProgress > 0 && (
        <div className="mt-2">
          <Progress value={processingProgress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">{processingStage || "Processing..."}</p>
        </div>
      )}
      
      {isDisabled && (
        <p className="text-xs text-red-500 mt-1">
          Recording exceeds the 100MB upload limit
        </p>
      )}
    </div>
  );
};
