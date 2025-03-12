
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "@/components/record/RecordingSection";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { RecordingActions } from "@/components/record/RecordingActions";
import { useFileUpload } from "@/hooks"; 
import { useRecordingSave } from "@/hooks/record/useRecordingSave";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const SimpleRecord = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { isUploading } = useFileUpload();
  const { saveRecording, isProcessing: isSaveProcessing } = useRecordingSave();
  const [keepAudio, setKeepAudio] = useState(true);
  const [isPageReady, setIsPageReady] = useState(false);

  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    isSystemAudio,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    handleSaveRecording,
    getCurrentDuration,
    deviceSelectionReady,
    lastAction,
    initError
  } = useRecording();

  useEffect(() => {
    // Short delay to ensure components are rendered properly
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been successfully activated. You can now start recording!",
        duration: 5000,
      });
    }
  }, [searchParams, toast]);

  const handleSave = async () => {
    try {
      if (isRecording) {
        await handleStopRecording();
      }
      
      await saveRecording(
        isRecording, 
        async () => {
          const result = await handleStopRecording();
          return result || { blob: null, duration: 0 }; // Ensure we return a consistent object
        }, 
        mediaStream, 
        audioUrl, 
        getCurrentDuration()
      );
    } catch (error) {
      console.error('[SimpleRecord] Error in handleSave:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving the recording.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isTranscribing || isSaving || isUploading || isSaveProcessing;
  const hasRecording = !!audioUrl;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="recorder" />
        <div className="flex-1">
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              {initError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error initializing recording: {initError.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {isPageReady && !processedContent ? (
                <>
                  <RecordingSection
                    isRecording={isRecording}
                    isPaused={isPaused}
                    audioUrl={audioUrl}
                    mediaStream={mediaStream}
                    isSystemAudio={isSystemAudio}
                    handleStartRecording={handleStartRecording}
                    handleStopRecording={async () => {
                      try {
                        const result = await handleStopRecording();
                        return result || { blob: null, duration: 0 };
                      } catch (error) {
                        console.error('[RecordingSection] Error stopping recording:', error);
                        return { blob: null, duration: 0 };
                      }
                    }}
                    handlePauseRecording={handlePauseRecording}
                    handleResumeRecording={handleResumeRecording}
                    handleDelete={handleDelete}
                    onSystemAudioChange={setIsSystemAudio}
                    audioDevices={audioDevices}
                    selectedDeviceId={selectedDeviceId}
                    onDeviceSelect={setSelectedDeviceId}
                    deviceSelectionReady={deviceSelectionReady}
                    showPlayButton={false}
                    showDeleteButton={true}
                    lastAction={lastAction}
                  />

                  <RecordingActions
                    onSave={handleSave}
                    isSaving={isLoading}
                    isLoading={isLoading}
                    isRecording={isRecording}
                    hasRecording={hasRecording}
                  />
                </>
              ) : processedContent ? (
                <ProcessedContentSection
                  processedContent={processedContent}
                  transcript={transcript}
                  processMutation={{
                    isPending: false,
                    mutate: () => {},
                  }}
                />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SimpleRecord;
