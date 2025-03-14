
import { useState } from "react";
import { FileUpload } from "@/components/shared/FileUpload";
import { ProcessingLogs } from "@/components/record/ProcessingLogs";

interface FileUploadSectionProps {
  isDisabled?: boolean;
}

export const FileUploadSection = ({ isDisabled }: FileUploadSectionProps) => {
  const [currentUploadInfo, setCurrentUploadInfo] = useState<{
    noteId: string;
    recordingId: string;
  } | null>(null);
  
  const handleUploadComplete = (noteId: string, recordingId: string) => {
    setCurrentUploadInfo({ noteId, recordingId });
  };
  
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
        onUploadComplete={handleUploadComplete}
      />
      
      {currentUploadInfo && (
        <div className="mt-4">
          <ProcessingLogs
            recordingId={currentUploadInfo.recordingId}
            noteId={currentUploadInfo.noteId}
            maxHeight="200px"
          />
        </div>
      )}
    </div>
  );
};
