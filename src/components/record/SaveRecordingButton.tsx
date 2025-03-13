
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface SaveRecordingButtonProps {
  onSave: () => void;
  isSaving: boolean;
  isDisabled: boolean;
  progress?: number;
  stage?: string;
}

export const SaveRecordingButton = ({ 
  onSave, 
  isSaving, 
  isDisabled,
  progress = 0,
  stage = ""
}: SaveRecordingButtonProps) => {
  const [isClickable, setIsClickable] = useState(true);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (!isSaving) {
      // Reset clickable state after saving completes
      setIsClickable(true);
    }
  }, [isSaving]);

  const handleClick = () => {
    if (!isClickable || isDisabled || isSaving) return;
    
    console.log('[SaveRecordingButton] Save button clicked');
    setIsClickable(false); // Prevent double clicks
    setClickCount(prev => prev + 1);
    
    if (clickCount > 0) {
      toast.info("Processing your request", {
        description: "Please wait while we process your recording"
      });
    }
    
    try {
      onSave();
    } catch (error) {
      console.error('[SaveRecordingButton] Error saving:', error);
      toast.error("Failed to save recording");
      setIsClickable(true); // Reset on error
    }
  };

  return (
    <div className="w-full max-w-[220px]">
      <Button 
        className="bg-palatinate-blue hover:bg-palatinate-blue/90 active:bg-palatinate-blue/80 text-white gap-2 w-full rounded-md"
        onClick={handleClick}
        disabled={isDisabled || isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            <span>Transcribe Now</span>
          </>
        )}
      </Button>
      
      {isSaving && progress > 0 && (
        <div className="mt-2">
          <Progress value={progress} className="h-2 bg-gray-200" />
          <p className="text-xs text-gray-500 mt-1">
            {stage || "Processing"}: {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
};
