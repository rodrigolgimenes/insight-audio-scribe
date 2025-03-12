
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
import { DebugMicrophonePanel } from "@/components/debug/DebugMicrophonePanel";
import { UnifiedRecordingSection } from "@/components/record/UnifiedRecordingSection";
import { DeviceManagerProvider } from "@/context/DeviceManagerContext";
import { Card, CardContent } from "@/components/ui/card";

const SimpleRecord = () => {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('SimpleRecord Component Mount', true);
  
  const { toast: legacyToast } = useToast();
  const [isPageReady, setIsPageReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { isUploading } = useFileUpload();

  const recordingHook = useRecording();
  
  useEffect(() => {
    console.log("[SimpleRecord RENDER] Recording hook states:", {
      compName: 'SimpleRecord',
      deviceCount: recordingHook.audioDevices.length,
      selectedDeviceId: recordingHook.selectedDeviceId,
      deviceSelectionReady: recordingHook.deviceSelectionReady,
      permissionState: recordingHook.permissionState,
      devicesLoading: recordingHook.devicesLoading,
      devices: recordingHook.audioDevices.map(d => ({
        id: d.deviceId,
        label: d.label || 'No label'
      }))
    });
  }, [
    recordingHook.audioDevices, 
    recordingHook.selectedDeviceId, 
    recordingHook.deviceSelectionReady,
    recordingHook.permissionState,
    recordingHook.devicesLoading
  ]);

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
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

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

  if (!isPageReady) {
    return <RecordPageLoading loadingProgress={loadingProgress} />;
  }

  PageLoadTracker.trackPhase('Render Main Content', true);
  
  const handleForceRefresh = () => {
    console.log("[SimpleRecord] Force refreshing devices - BEFORE:", {
      deviceCount: recordingHook.audioDevices.length,
      permissionState: recordingHook.permissionState
    });
    
    if (recordingHook.refreshDevices) {
      recordingHook.refreshDevices().then(() => {
        console.log("[SimpleRecord] Force refresh completed - AFTER:", {
          deviceCount: recordingHook.audioDevices.length,
          permissionState: recordingHook.permissionState
        });
      });
      toast.info("Forcing device refresh...");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-ghost-white">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-ghost-white">
          <main className="container mx-auto px-4 py-8 space-y-8">
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
            
            {/* Unified Device Manager Demo Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h2 className="text-xl font-bold mb-4 text-blue-800">Unified Device Manager Demo</h2>
              <p className="text-blue-700 mb-4">
                This section demonstrates the unified device management approach using a shared context.
                Both components below share the same device list and selection state.
              </p>
              
              <DeviceManagerProvider>
                <div className="space-y-6">
                  <DebugMicrophonePanel />
                  <UnifiedRecordingSection />
                </div>
              </DeviceManagerProvider>
            </div>
            
            {/* Original Implementation */}
            <h2 className="text-xl font-bold mb-4">Original Implementation (for comparison)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Microphones (Simple Detection)</h2>
                  <DebugMicList />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Microphones (Complex Detector)</h2>
                  <DeviceListTester />
                </CardContent>
              </Card>
            </div>
            
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
