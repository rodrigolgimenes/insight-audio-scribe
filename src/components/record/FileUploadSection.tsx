
import { FileUpload } from "@/components/shared/FileUpload";

interface FileUploadSectionProps {
  isDisabled?: boolean;
}

export const FileUploadSection = ({ isDisabled }: FileUploadSectionProps) => {
  return (
    <div className="w-full max-w-[220px]">
      <FileUpload 
        buttonText="Upload File"
        description="Upload audio or video to transcribe"
        accept="audio/*,video/mp4,video/webm,video/quicktime"
        disabled={isDisabled}
        initiateTranscription={true}
        buttonClassName="w-full rounded-md"
        hideDescription={true}
      />
    </div>
  );
};
