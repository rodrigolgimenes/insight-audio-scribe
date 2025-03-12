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
import { toast } from "sonner";

const SimpleRecord = () => {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('SimpleRecord Component Mount', true);
  
  const { toast: legacyToast } = useToast();
  const [isPageReady, setIsPageReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { isUploading } = useFileUpload();
  
  // Create a mock saveRecording function that doesn't require actual authentication
  const mockSaveRecording = async () => {
    toast.success("Recording would be saved in production environment");
    return { success: true };
  };
  
  const saveProps = {
    saveRecording: mockSaveRecording,
    isProcessing: false
  };

  // Loading progress simulation
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 100) {
        progress += 10;
        setLoadingProgress(progress);
      } else {
        clearInterval(interval);
        setIsPageReady(true);
      }
    }, 200);

    return () => clearInterval(interval);
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
        toast.error("Recording initialization failed", {
          description: recordingHook.initError.message
        });
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
        
        toast.success("Recording processed successfully!", {
          description: "In a production environment, this would be saved to your account."
        });
        
        PageLoadTracker.trackPhase('Save Operation Complete', true);
      } catch (error) {
        PageLoadTracker.trackPhase('Save Operation Error', false, error.message);
        toast.error("Error", {
          description: "An error occurred while saving the recording."
        });
      }
    };

    const isLoading = recordingHook.isTranscribing || recordingHook.isSaving || isUploading || saveProps.isProcessing;

    // Render loading state if page is not ready yet
    if (!isPageReady) {
      return <RecordPageLoading loadingProgress={loadingProgress} />;
    }

    PageLoadTracker.trackPhase('Render Main Content', true);

    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-ghost-white">
          <AppSidebar activePage="recorder" />
          <div className="flex-1 bg-ghost-white">
            <main className="container mx-auto px-4 py-8">
              <SimpleRecordContent
                recordingHook={recordingHook}
                isLoading={isLoading}
                error={error}
                saveRecording={handleSave}
                isSaveProcessing={saveProps.isProcessing}
              />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  } catch (error) {
    PageLoadTracker.trackPhase('Fatal Error in Component', false, error.message);
    console.error("Fatal error in SimpleRecord:", error);
    return <RecordPageError errorMessage={error.message} />;
  }
};

export default SimpleRecord;
