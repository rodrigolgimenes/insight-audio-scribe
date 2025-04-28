
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/shared/FileUpload";
import { ConversionLogsPanel } from "@/components/shared/ConversionLogsPanel";

interface UploadPanelProps {
  session: any;
  isRecording: boolean;
  handleUploadComplete: (noteId: string, recordingId: string) => void;
  handleConversionUpdate: (
    status: 'idle' | 'converting' | 'success' | 'error',
    progress: number,
    origFile: File | null,
    convFile: File | null
  ) => void;
  showConversionLogs: boolean;
  conversionStatus: 'idle' | 'converting' | 'success' | 'error';
  conversionProgress: number;
  originalFile: File | null;
  convertedFile: File | null;
  handleDownloadConvertedFile: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  session,
  isRecording,
  handleUploadComplete,
  handleConversionUpdate,
  showConversionLogs,
  conversionStatus,
  conversionProgress,
  originalFile,
  convertedFile,
  handleDownloadConvertedFile
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Already have a recording?</h3>
        <FileUpload 
          buttonText="Upload File"
          description="Upload audio or video to transcribe"
          accept="audio/*,video/mp4,video/webm,video/quicktime"
          initiateTranscription={true}
          buttonClassName="w-full rounded-md"
          onUploadComplete={handleUploadComplete}
          onConversionUpdate={handleConversionUpdate}
          disabled={isRecording || !session}
        />
        
        {showConversionLogs && (
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
      </CardContent>
    </Card>
  );
};
