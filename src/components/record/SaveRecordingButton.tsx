
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SaveRecordingButtonProps {
  onSave: () => void;
  isSaving: boolean;
  isDisabled: boolean;
}

export const SaveRecordingButton = ({ onSave, isSaving, isDisabled }: SaveRecordingButtonProps) => {
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
      toast.error("Failed to save recording", {
        description: error.message || "An unknown error occurred"
      });
      setIsClickable(true); // Reset on error
    }
  };

  return (
    <Button 
      className="bg-[#4285F4] hover:bg-[#3367D6] active:bg-[#2A56C6] text-white gap-2 w-full max-w-[220px] rounded-md"
      onClick={handleClick}
      disabled={isDisabled || isSaving}
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
