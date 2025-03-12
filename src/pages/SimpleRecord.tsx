
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
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { Progress } from "@/components/ui/progress";

const SimpleRecord = () => {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('SimpleRecord Component Mount', true);

  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { isUploading } = useFileUpload();
  const { saveRecording, isProcessing: isSaveProcessing } = useRecordingSave();
  const [keepAudio, setKeepAudio] = useState(true);
  const [isPageReady, setIsPageReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Initialize recording functionality
  try {
    PageLoadTracker.trackPhase('Recording Hook Initialization Start', true);
    const recordingHook = useRecording();
    PageLoadTracker.trackPhase('Recording Hook Initialization Complete', true);

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

    // Loading progress simulation
    useEffect(() => {
      let progress = 0;
      const interval = setInterval(() => {
        if (progress < 100) {
          progress += 10;
          setLoadingProgress(progress);
        } else {
          clearInterval(interval);
        }
      }, 200);

      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      PageLoadTracker.trackPhase('Component Mount Effect', true);
      const timer = setTimeout(() => {
        setIsPageReady(true);
        PageLoadTracker.trackPhase('Page Ready State Set', true);
      }, 300);
      
      return () => {
        clearTimeout(timer);
        PageLoadTracker.trackPhase('Component Unmount', true);
      };
    }, []);

    // Handle initialization errors
    useEffect(() => {
      if (initError) {
        PageLoadTracker.trackPhase('Initialization Error Detected', false, initError.message);
        setError(initError.message);
      } else {
        setError(null);
      }
    }, [initError]);

    const handleSave = async () => {
      PageLoadTracker.trackPhase('Save Operation Started', true);
      try {
        if (isRecording) {
          await handleStopRecording();
        }
        
        await saveRecording(
          isRecording,
          async () => {
            try {
              const result = await handleStopRecording();
              PageLoadTracker.trackPhase('Recording Stop Success', true);
              return result || { blob: null, duration: 0 };
            } catch (error) {
              PageLoadTracker.trackPhase('Recording Stop Error', false, error.message);
              return { blob: null, duration: 0 };
            }
          },
          mediaStream,
          audioUrl,
          getCurrentDuration ? getCurrentDuration() : 0
        );
        
        PageLoadTracker.trackPhase('Save Operation Complete', true);
      } catch (error) {
        PageLoadTracker.trackPhase('Save Operation Error', false, error.message);
        toast({
          title: "Error",
          description: "An error occurred while saving the recording.",
          variant: "destructive",
        });
      }
    };

    const isLoading = isTranscribing || isSaving || isUploading || isSaveProcessing;
    const hasRecording = !!audioUrl;

    PageLoadTracker.trackPhase('Render Preparation', true);

    if (!isPageReady) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <div className="w-full max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-center">Loading Audio Recorder</h2>
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-center text-muted-foreground">
              Initializing audio components...
            </p>
          </div>
        </div>
      );
    }

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
                
                {!processedContent ? (
                  <>
                    <RecordingSection
                      isRecording={isRecording}
                      isPaused={isPaused}
                      audioUrl={audioUrl}
                      mediaStream={mediaStream}
                      isSystemAudio={isSystemAudio}
                      handleStartRecording={handleStartRecording}
                      handleStopRecording={handleStopRecording}
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
                ) : (
                  <ProcessedContentSection
                    processedContent={processedContent}
                    transcript={transcript}
                    processMutation={{
                      isPending: false,
                      mutate: () => {},
                    }}
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  } catch (error) {
    PageLoadTracker.trackPhase('Fatal Error in Component', false, error.message);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A critical error occurred while loading the recorder: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
};

export default SimpleRecord;
