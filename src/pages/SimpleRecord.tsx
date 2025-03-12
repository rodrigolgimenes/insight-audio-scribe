
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/useRecording";
import { useFileUpload } from "@/hooks";
import { useRecordingSave } from "@/hooks/record/useRecordingSave";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { RecordPageLoading } from "@/components/record/RecordPageLoading";
import { RecordPageError } from "@/components/record/RecordPageError";
import { SimpleRecordContent } from "@/components/record/SimpleRecordContent";

const SimpleRecord = () => {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('SimpleRecord Component Mount', true);
  
  const { toast } = useToast();
  const [isPageReady, setIsPageReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { isUploading } = useFileUpload();
  const { saveRecording, isProcessing: isSaveProcessing } = useRecordingSave();

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

  // Set page as ready after a short delay
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

  try {
    // Initialize recording functionality
    PageLoadTracker.trackPhase('Recording Hook Initialization Start', true);
    const recordingHook = useRecording();
    PageLoadTracker.trackPhase('Recording Hook Initialization Complete', true);
    
    // Handle initialization errors
    useEffect(() => {
      if (recordingHook.initError) {
        PageLoadTracker.trackPhase('Initialization Error Detected', false, recordingHook.initError.message);
        setError(recordingHook.initError.message);
      } else {
        setError(null);
      }
    }, [recordingHook.initError]);

    const handleSave = async () => {
      PageLoadTracker.trackPhase('Save Operation Started', true);
      try {
        if (recordingHook.isRecording) {
          await recordingHook.handleStopRecording();
        }
        
        await saveRecording(
          recordingHook.isRecording,
          async () => {
            try {
              const result = await recordingHook.handleStopRecording();
              PageLoadTracker.trackPhase('Recording Stop Success', true);
              return result || { blob: null, duration: 0 };
            } catch (error) {
              PageLoadTracker.trackPhase('Recording Stop Error', false, error.message);
              return { blob: null, duration: 0 };
            }
          },
          recordingHook.mediaStream,
          recordingHook.audioUrl,
          recordingHook.getCurrentDuration ? recordingHook.getCurrentDuration() : 0
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

    const isLoading = recordingHook.isTranscribing || recordingHook.isSaving || isUploading || isSaveProcessing;

    // Render loading state if page is not ready yet
    if (!isPageReady) {
      return <RecordPageLoading loadingProgress={loadingProgress} />;
    }

    PageLoadTracker.trackPhase('Render Main Content', true);

    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar activePage="recorder" />
          <div className="flex-1">
            <main className="container mx-auto px-4 py-8">
              <SimpleRecordContent
                recordingHook={recordingHook}
                isLoading={isLoading}
                error={error}
                saveRecording={handleSave}
                isSaveProcessing={isSaveProcessing}
              />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  } catch (error) {
    PageLoadTracker.trackPhase('Fatal Error in Component', false, error.message);
    return <RecordPageError errorMessage={error.message} />;
  }
};

export default SimpleRecord;
