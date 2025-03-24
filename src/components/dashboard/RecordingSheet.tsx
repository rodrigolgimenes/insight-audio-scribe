import { useEffect, useState, useCallback } from "react";
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function RecordingSheet() {
  const { toast } = useToast();
  const [isComponentReady, setIsComponentReady] = useState(false);
  
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
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    handleSaveRecording,
    handleDelete,
    deviceSelectionReady,
    recordingAttemptsCount,
    initError,
    lastAction,
    refreshDevices,
    devicesLoading,
    permissionState,
    isRestrictedRoute
  } = useRecording();

  const checkIsRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);

  const handleRefreshDevices = async () => {
    try {
      if (refreshDevices) {
        await refreshDevices();
        
        if (!checkIsRestrictedRoute()) {
          toast({
            title: "Devices refreshed",
            variant: "default"
          });
        }
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing devices:", error);
      
      if (!checkIsRestrictedRoute()) {
        toast({
          title: "Error refreshing devices",
          variant: "destructive"
        });
      }
      
      return Promise.reject(error);
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    console.log('[RecordingSheet] Device selected:', deviceId);
    setSelectedDeviceId(deviceId);
    
    if (!checkIsRestrictedRoute()) {
      toast({
        title: "Microphone selected",
        variant: "default"
      });
    } else {
      console.log('[RecordingSheet] Toast suppressed on restricted route');
    }
  };

  const handleWrappedStopRecording = async () => {
    try {
      await handleStopRecording();
      console.log('[RecordingSheet] Recording stopped manually');
      
      if (!checkIsRestrictedRoute()) {
        toast({
          title: "Recording stopped",
          variant: "default"
        });
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error stopping recording:", error);
      return Promise.reject(error);
    }
  };

  const handleSave = async () => {
    try {
      console.log('[RecordingSheet] Save button clicked');
      await handleSaveRecording();
      return Promise.resolve();
    } catch (error) {
      console.error("Error saving recording:", error);
      return Promise.reject(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComponentReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('[RecordingSheet] State updated:', { 
      isRecording, 
      isPaused, 
      audioUrl: audioUrl ? 'exists' : 'null',
      deviceSelectionReady,
      selectedDeviceId,
      audioDevices: audioDevices.length,
      recordingAttemptsCount,
      hasInitError: !!initError,
      isComponentReady,
      devicesLoading,
      permissionState,
      isRestrictedRoute: isRestrictedRoute
    });
  }, [isRecording, isPaused, audioUrl, deviceSelectionReady, selectedDeviceId, 
      audioDevices.length, recordingAttemptsCount, initError, isComponentReady,
      devicesLoading, permissionState, isRestrictedRoute]);

  return (
    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Record Audio</h2>
          <p className="text-sm text-gray-500">Record audio from your microphone or system audio.</p>
        </div>

        {initError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error initializing recording: {initError.message}
            </AlertDescription>
          </Alert>
        )}

        {recordingAttemptsCount > 0 && !isRecording && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Recording start attempts: {recordingAttemptsCount}
              {lastAction && (
                <div className="text-xs mt-1">
                  Last action: {lastAction.action} - {new Date(lastAction.timestamp).toLocaleTimeString()} - 
                  {lastAction.success ? 
                    <span className="text-green-600"> Success</span> : 
                    <span className="text-red-600"> Failed</span>}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isComponentReady && (
          <>
            <RecordingSection 
              isRecording={isRecording}
              isPaused={isPaused}
              audioUrl={audioUrl}
              mediaStream={mediaStream}
              isSystemAudio={isSystemAudio}
              handleStartRecording={() => {
                console.log('[RecordingSheet] Start recording button clicked');
                handleStartRecording();
              }}
              handleStopRecording={handleWrappedStopRecording}
              handlePauseRecording={handlePauseRecording}
              handleResumeRecording={handleResumeRecording}
              handleDelete={handleDelete}
              onSystemAudioChange={(value) => {
                console.log('[RecordingSheet] System audio changed:', value);
                setIsSystemAudio(value);
              }}
              audioDevices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              onDeviceSelect={handleDeviceSelect}
              deviceSelectionReady={deviceSelectionReady}
              showPlayButton={false}
              showDeleteButton={true}
              lastAction={lastAction}
              onRefreshDevices={handleRefreshDevices}
              devicesLoading={devicesLoading}
              permissionState={permissionState as any}
              isRestrictedRoute={isRestrictedRoute}
              onSave={handleSave}
              isSaving={isSaving}
            />

            <div className="mt-6 flex justify-center">
              <SaveRecordingButton
                onSave={handleSave}
                isSaving={isSaving}
                isDisabled={!isRecording && !audioUrl}
              />
            </div>
          </>
        )}
      </div>
    </SheetContent>
  );
}
