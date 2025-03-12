
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/useRecording";
import { useFileUpload } from "@/hooks";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { RecordPageLoading } from "@/components/record/RecordPageLoading";
import { RecordPageError } from "@/components/record/RecordPageError";
import { SimpleRecordContent } from "@/components/record/SimpleRecordContent";
import { toast } from "sonner";
import { DeviceListTester } from "@/components/record/DeviceListTester";
import { DebugMicList } from "@/components/record/DebugMicList";
import { Card, CardContent } from "@/components/ui/card";

const SimpleRecord = () => {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('SimpleRecord Component Mount', true);
  
  const { toast: legacyToast } = useToast();
  const [isPageReady, setIsPageReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { isUploading } = useFileUpload();

  // Initialize recording hook outside of try-catch to ensure proper cleanup
  const recordingHook = useRecording();
  
  // Loading progress simulation with shorter intervals
  useEffect(() => {
    if (!isPageReady) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setLoadingProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsPageReady(true);
        }
      }, 100); // Faster loading simulation

      return () => clearInterval(interval);
    }
  }, []);

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

  // Create a mock saveRecording function that doesn't require actual authentication
  const mockSaveRecording = async () => {
    toast.success("Recording would be saved in production environment");
    return { success: true };
  };
  
  const saveProps = {
    saveRecording: mockSaveRecording,
    isProcessing: false
  };

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

  // Show loading state if page is not ready
  if (!isPageReady) {
    return <RecordPageLoading loadingProgress={loadingProgress} />;
  }

  PageLoadTracker.trackPhase('Render Main Content', true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-ghost-white">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-ghost-white">
          <main className="container mx-auto px-4 py-8 space-y-8">
            {/* Debug Microphone Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Debug Mic List - Simple version with direct detection */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Microphones (Simple Detection)</h2>
                  <DebugMicList />
                </CardContent>
              </Card>
              
              {/* Device Tester - Full implementation logic */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Microphones (Complex Detector)</h2>
                  <DeviceListTester />
                </CardContent>
              </Card>
            </div>
            
            {/* Original content */}
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
};

export default SimpleRecord;
