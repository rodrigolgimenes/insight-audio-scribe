
import { useState } from "react";
import { FileUpload } from "@/components/shared/FileUpload";
import { ProcessingLogs } from "@/components/record/ProcessingLogs";
import { ConversionLogsPanel } from "@/components/shared/ConversionLogsPanel";

interface FileUploadSectionProps {
  isDisabled?: boolean;
  showDetailsPanel?: boolean;
}

export const FileUploadSection = ({ isDisabled, showDetailsPanel = false }: FileUploadSectionProps) => {
  const [currentUploadInfo, setCurrentUploadInfo] = useState<{
    noteId: string;
    recordingId: string;
  } | null>(null);
  
  const [showConversionLogs, setShowConversionLogs] = useState<boolean>(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  
  const handleUploadComplete = (noteId: string, recordingId: string) => {
    setCurrentUploadInfo({ noteId, recordingId });
  };
  
  const handleConversionUpdate = (
    status: 'idle' | 'converting' | 'success' | 'error', 
    progress: number, 
    origFile: File | null, 
    convFile: File | null
  ) => {
    setConversionStatus(status);
    setConversionProgress(progress);
    setOriginalFile(origFile);
    setConvertedFile(convFile);
    setShowConversionLogs(true);
  };
  
  const handleDownloadConvertedFile = () => {
    if (convertedFile) {
      const url = URL.createObjectURL(convertedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = convertedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <FileUpload 
          buttonText="Upload File"
          description="Upload audio or video to transcribe"
          accept="audio/*,video/mp4,video/webm,video/quicktime"
          disabled={isDisabled}
          initiateTranscription={true}
          buttonClassName="w-full rounded-md"
          hideDescription={true}
          onUploadComplete={handleUploadComplete}
          onConversionUpdate={handleConversionUpdate}
          skipDeviceCheck={true}
        />
      </div>
      
      {showDetailsPanel && showConversionLogs && (
        <div className="mt-4">
          <ConversionLogsPanel
            originalFile={originalFile}
            convertedFile={convertedFile}
            conversionStatus={conversionStatus}
            conversionProgress={conversionProgress}
            onDownload={convertedFile ? handleDownloadConvertedFile : undefined}
            onTranscribe={undefined}
          />
        </div>
      )}
      
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
}
