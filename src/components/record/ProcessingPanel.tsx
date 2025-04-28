
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ProcessingLogs } from "./ProcessingLogs";

interface ProcessingPanelProps {
  currentProcessingId: string | null;
  currentUploadInfo: {
    noteId: string;
    recordingId: string;
  } | null;
}

export const ProcessingPanel: React.FC<ProcessingPanelProps> = ({
  currentProcessingId,
  currentUploadInfo
}) => {
  if (!currentProcessingId && !currentUploadInfo?.recordingId) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Processing Status</h3>
        <ProcessingLogs 
          recordingId={currentProcessingId || (currentUploadInfo ? currentUploadInfo.recordingId : null)} 
          noteId={currentUploadInfo ? currentUploadInfo.noteId : undefined}
        />
      </CardContent>
    </Card>
  );
};
