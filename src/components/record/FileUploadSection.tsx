
import { FileUpload } from "@/components/shared/FileUpload";

interface FileUploadSectionProps {
  isDisabled?: boolean;
}

export const FileUploadSection = ({ isDisabled }: FileUploadSectionProps) => {
  return (
    <div className="relative">
      <FileUpload 
        buttonText="Upload File"
        description="Upload audio or video to transcribe"
        accept="audio/*,video/mp4"
        disabled={isDisabled}
      />
    </div>
  );
};
