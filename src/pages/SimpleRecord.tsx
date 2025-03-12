
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
  
  // Log devices for debugging
  useEffect(() => {
    console.log("[SimpleRecord] Recording hook devices:", {
      deviceCount: recordingHook.audioDevices.length,
      selectedDeviceId: recordingHook.selectedDeviceId,
      deviceSelectionReady: recordingHook.deviceSelectionReady,
      permissionState: recordingHook.permissionState,
      devices: recordingHook.audioDevices.map(d => ({
        id: d.deviceId,
        label: d.label || 'No label'
      }))
    });
  }, [
    recordingHook.audioDevices, 
    recordingHook.selectedDeviceId, 
    recordingHook.deviceSelectionReady,
    recordingHook.permissionState
  ]);

  // If no device is selected but we have devices, auto-select the first one
  useEffect(() => {
    if (
      recordingHook.audioDevices.length > 0 && 
      (!recordingHook.selectedDeviceId || 
        !recordingHook.audioDevices.some(d => d.deviceId === recordingHook.selectedDeviceId))
    ) {
      console.log("[SimpleRecord] Auto-selecting first device:", recordingHook.audioDevices[0].deviceId);
      recordingHook.setSelectedDeviceId(recordingHook.audioDevices[0].deviceId);
    }
  }, [recordingHook.audioDevices, recordingHook.selectedDeviceId, recordingHook.setSelectedDeviceId]);
  
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
  
  // Force refresh devices on button click
  const handleForceRefresh = () => {
    console.log("[SimpleRecord] Force refreshing devices");
    if (recordingHook.refreshDevices) {
      recordingHook.refreshDevices();
      toast.info("Forcing device refresh...");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-ghost-white">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-ghost-white">
          <main className="container mx-auto px-4 py-8 space-y-8">
            {/* Debug Controls */}
            <Card className="bg-white shadow">
              <CardContent className="p-4">
                <h2 className="text-lg font-bold mb-2">Debugging Tools</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleForceRefresh}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Force Refresh Devices
                  </button>
                  <button 
                    onClick={() => {
                      if (recordingHook.audioDevices.length > 0) {
                        recordingHook.setSelectedDeviceId(recordingHook.audioDevices[0].deviceId);
                        toast.info(`Selected first device: ${recordingHook.audioDevices[0].label || 'Unknown device'}`);
                      } else {
                        toast.error("No devices available to select");
                      }
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    disabled={recordingHook.audioDevices.length === 0}
                  >
                    Force Select First Device
                  </button>
                </div>
              </CardContent>
            </Card>
            
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
            
            {/* Device Selection State Debug */}
            <Card className="bg-white shadow">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Device Selection Debug</h2>
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold">Selected Device ID:</span> {recordingHook.selectedDeviceId || 'None'}</div>
                  <div><span className="font-semibold">Device Selection Ready:</span> {recordingHook.deviceSelectionReady ? 'Yes' : 'No'}</div>
                  <div><span className="font-semibold">Devices Found:</span> {recordingHook.audioDevices.length}</div>
                  <div><span className="font-semibold">Permission State:</span> {recordingHook.permissionState}</div>
                  <div><span className="font-semibold">Devices Loading:</span> {recordingHook.devicesLoading ? 'Yes' : 'No'}</div>
                  
                  <div className="pt-2">
                    <span className="font-semibold">Available Devices:</span>
                    <div className="pl-4 mt-1 space-y-1">
                      {recordingHook.audioDevices.length > 0 ? (
                        recordingHook.audioDevices.map((device, index) => (
                          <div key={device.deviceId} className={`p-2 border rounded ${device.deviceId === recordingHook.selectedDeviceId ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}>
                            <div className="flex justify-between">
                              <span className="font-medium">{device.label || `Device ${index + 1}`}</span>
                              <button
                                onClick={() => recordingHook.setSelectedDeviceId(device.deviceId)}
                                className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Select
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 truncate">{device.deviceId}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-red-500">No devices available</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
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
