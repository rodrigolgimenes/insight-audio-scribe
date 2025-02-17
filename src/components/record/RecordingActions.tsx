
import { SaveRecordingButton } from "./SaveRecordingButton";
import { FileUploadSection } from "./FileUploadSection";
import { useToast } from "@/hooks/use-toast";

interface RecordingActionsProps {
  onSave: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
}

export const RecordingActions = ({ onSave, isSaving, isLoading }: RecordingActionsProps) => {
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await onSave();
    } catch (error) {
      console.error('Error in RecordingActions:', error);
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <SaveRecordingButton 
          onSave={handleSave}
          isSaving={isSaving}
          isDisabled={isLoading}
        />
        <FileUploadSection isDisabled={isLoading} />
      </div>
    </div>
  );
};
