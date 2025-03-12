
import React, { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { RecordMeetingContent } from "@/components/meetings/RecordMeetingContent";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const TestRecordMeeting = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUploadStart = () => {
    setIsUploading(true);
    setError(null);
  };
  
  const handleUploadSuccess = (transcriptionText: string) => {
    setTranscription(transcriptionText);
    setIsUploading(false);
    toast.success("Audio transcribed successfully!");
  };
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsUploading(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar activePage="test-record" />
        <div className="flex-1">
          <main className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Audio Recording</h1>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <RecordMeetingContent 
                isLoading={isLoading}
                isUploading={isUploading}
                onUploadStart={handleUploadStart}
                onUploadComplete={handleUploadSuccess}
                onError={handleError}
              />
              
              {transcription && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Transcription</h2>
                  <div className="p-4 bg-gray-50 rounded border border-gray-200 text-gray-800 max-h-96 overflow-y-auto">
                    {transcription}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TestRecordMeeting;
