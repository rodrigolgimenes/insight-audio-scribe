
import React, { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AlertCircle, FileText, FileAudio, Check, X, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SimpleAudioRecorder } from "@/components/meetings/SimpleAudioRecorder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TestRecordMeeting = () => {
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle'); // idle, recording, processing, completed, error
  const [isLoading, setIsLoading] = useState(false);
  
  const handleNewTranscription = (text: string) => {
    if (text === "Processing your audio with fast-whisper. Please wait...") {
      setStatus('processing');
    } else {
      setTranscription(text);
      setStatus('completed');
      setError(null);
    }
  };
  
  const getStatusBadge = () => {
    switch (status) {
      case 'recording':
        return <Badge className="bg-red-500">Recording</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar activePage="test-record" />
        <div className="flex-1">
          <main className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">Fast-Whisper Audio Transcription</h1>
                  {getStatusBadge()}
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <SimpleAudioRecorder
                    onNewTranscription={handleNewTranscription}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </div>
                
                <div>
                  {status === 'processing' && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium flex items-center">
                          <RefreshCcw className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                          Processing Transcription
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500">
                          Your audio is being processed by the transcription service. This might take a moment depending 
                          on the length of your recording. Please wait...
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                          <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {transcription && status === 'completed' && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-green-500" />
                          Transcription
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-white rounded border border-gray-200 text-gray-800 max-h-[400px] overflow-y-auto">
                          {transcription}
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          Transcription completed successfully
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {status === 'error' && (
                    <Card className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium flex items-center">
                          <X className="h-4 w-4 mr-2 text-red-500" />
                          Transcription Failed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-red-600 text-sm">
                          {error || "An unknown error occurred during transcription."}
                        </p>
                        <p className="mt-3 text-gray-600 text-sm">
                          Please try again or contact support if the issue persists.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {status === 'idle' && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-medium flex items-center">
                          <FileAudio className="h-4 w-4 mr-2 text-blue-500" />
                          How to Use
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal ml-5 space-y-2 text-gray-600">
                          <li>Click "Start Recording" and speak clearly.</li>
                          <li>When finished, click "Stop Recording".</li>
                          <li>Click "Transcribe Audio" to process the recording.</li>
                          <li>Wait for the transcription to complete.</li>
                        </ol>
                        <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                          This demo uses JavaScript-based transcription for efficient and accurate speech recognition.
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TestRecordMeeting;
