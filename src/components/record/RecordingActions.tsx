
import { SaveRecordingButton } from "./SaveRecordingButton";
import { FileUploadSection } from "./FileUploadSection";

interface RecordingActionsProps {
  onSave: () => void;
  isSaving: boolean;
  isLoading: boolean;
  isRecording: boolean;
  hasRecording: boolean;
}

export const RecordingActions = ({ 
  onSave, 
  isSaving, 
  isLoading, 
  isRecording,
  hasRecording
}: RecordingActionsProps) => {
  return (
    <div className="flex flex-col items-center mt-8 gap-8">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-2xl">
        <div className="flex flex-col items-center w-full md:w-1/2">
          <p className="text-center text-sm text-gray-600 mb-2">
            Record and create a transcription
          </p>
          <h3 className="text-center font-semibold text-[#9b87f5] mb-3">
            Transcribe Now
          </h3>
          <SaveRecordingButton 
            onSave={onSave}
            isSaving={isSaving}
            isDisabled={isLoading || (!isRecording && !hasRecording)}
          />
        </div>
        
        <div className="flex flex-col items-center w-full md:w-1/2">
          <p className="text-center text-sm text-gray-600 mb-2">
            Already have a recording?
          </p>
          <FileUploadSection isDisabled={isLoading || isRecording} />
        </div>
      </div>
    </div>
  );
};
