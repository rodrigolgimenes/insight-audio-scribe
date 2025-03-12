
import React, { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SimpleAudioRecorder } from "@/components/meetings/SimpleAudioRecorder";
import { supabase } from "@/integrations/supabase/client";

const TestRecordMeeting = () => {
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  
  const handleTranscriptionComplete = (text: string) => {
    setTranscription(text);
    setError(null);
  };
  
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
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
              
              <SimpleAudioRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
                onError={handleError}
              />
              
              {transcription && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow max-w-3xl mx-auto">
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
