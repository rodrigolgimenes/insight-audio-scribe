
import React, { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { RecordMeetingContent } from "@/components/meetings/RecordMeetingContent";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TestRecordMeeting = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUploadSuccess = (transcriptionText: string) => {
    setTranscription(transcriptionText);
    toast.success("Áudio transcrito com sucesso!");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-ghost-white">
        <AppSidebar activePage="test-record" />
        <div className="flex-1 bg-ghost-white">
          <main className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Gravar Reunião (Teste)</h1>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <RecordMeetingContent 
                isLoading={isLoading}
                isUploading={isUploading}
                onUploadStart={() => setIsUploading(true)}
                onUploadComplete={handleUploadSuccess}
                onError={setError}
              />
              
              {transcription && (
                <div className="mt-8 p-6 bg-white rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Transcrição</h2>
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
