
import { SaveRecordingButton } from "./SaveRecordingButton";
import { FileUploadSection } from "./FileUploadSection";

interface RecordingActionsProps {
  onSave: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
}

export const RecordingActions = ({ onSave, isSaving, isLoading }: RecordingActionsProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <SaveRecordingButton 
          onSave={onSave}
          isSaving={isSaving}
          isDisabled={isLoading}
        />
        <FileUploadSection isDisabled={isLoading} />
      </div>
    </div>
  );
};
