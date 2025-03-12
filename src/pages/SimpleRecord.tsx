
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
  console.log("[SimpleRecord] Component rendering");
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { isUploading } = useFileUpload();
  const { saveRecording, isProcessing: isSaveProcessing } = useRecordingSave();
  const [keepAudio, setKeepAudio] = useState(true);
  const [isPageReady, setIsPageReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize recording functionality - simplify initialization to prevent errors
  console.log("[SimpleRecord] About to initialize recording hook");
  const recordingHook = useRecording();
  
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
    deviceSelectionReady,
    getCurrentDuration,
    lastAction,
    initError
  } = recordingHook;

  console.log("[SimpleRecord] Recording hook initialized successfully");

  useEffect(() => {
    console.log("[SimpleRecord] Component mounted");
    
    // Short delay to ensure components are rendered properly
    const timer = setTimeout(() => {
      setIsPageReady(true);
      console.log("[SimpleRecord] Page ready set to true");
    }, 300);
    
    return () => {
      console.log("[SimpleRecord] Component unmounting");
      clearTimeout(timer);
    };
  }, []);

  // Handle initialization errors
  useEffect(() => {
    if (initError) {
      console.error("[SimpleRecord] Recording initialization error:", initError);
      setError(initError.message);
    } else {
      setError(null);
    }
  }, [initError]);

  // Handle success messages from URL parameters
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

  // Create a robust save handler
  const handleSave = async () => {
    console.log("[SimpleRecord] Save requested");
    try {
      if (isRecording) {
        console.log("[SimpleRecord] Stopping recording before saving");
        await handleStopRecording();
      }
      
      console.log("[SimpleRecord] Calling saveRecording");
      await saveRecording(
        isRecording, 
        async () => {
          try {
            const result = await handleStopRecording();
            console.log("[SimpleRecord] Stop recording result:", result);
            return result || { blob: null, duration: 0 };
          } catch (error) {
            console.error("[SimpleRecord] Error stopping recording in save handler:", error);
            return { blob: null, duration: 0 };
          }
        }, 
        mediaStream, 
        audioUrl, 
        getCurrentDuration ? getCurrentDuration() : 0
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

  console.log("[SimpleRecord] Render with state:", { 
    isPageReady, 
    hasContent: !!processedContent, 
    isLoading,
    hasRecording, 
    deviceSelectionReady,
    audioDevicesCount: audioDevices?.length || 0,
    isRecording,
    isPaused
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="recorder" />
        <div className="flex-1">
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error initializing recording: {error}
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
                        console.log('[SimpleRecord] Stopping recording from RecordingSection');
                        const result = await handleStopRecording();
                        console.log('[SimpleRecord] Recording stopped successfully:', result);
                        return result || { blob: null, duration: 0 };
                      } catch (error) {
                        console.error('[SimpleRecord] Error stopping recording from RecordingSection:', error);
                        return { blob: null, duration: 0 };
                      }
                    }}
                    handlePauseRecording={handlePauseRecording}
                    handleResumeRecording={handleResumeRecording}
                    handleDelete={handleDelete}
                    onSystemAudioChange={setIsSystemAudio}
                    audioDevices={audioDevices || []}
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
