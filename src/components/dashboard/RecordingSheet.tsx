
import { useEffect, useState } from "react";
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
    permissionState
  } = useRecording();

  // Ensure component is mounted before rendering complex components
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComponentReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Log component state for debugging
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
      permissionState
    });
  }, [isRecording, isPaused, audioUrl, deviceSelectionReady, selectedDeviceId, 
      audioDevices.length, recordingAttemptsCount, initError, isComponentReady,
      devicesLoading, permissionState]);

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
              handleStopRecording={() => handleStopRecording().then(() => {
                console.log('[RecordingSheet] Recording stopped manually');
              })}
              handlePauseRecording={handlePauseRecording}
              handleResumeRecording={handleResumeRecording}
              handleDelete={handleDelete}
              onSystemAudioChange={(value) => {
                console.log('[RecordingSheet] System audio changed:', value);
                setIsSystemAudio(value);
              }}
              audioDevices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              onDeviceSelect={(deviceId) => {
                console.log('[RecordingSheet] Device selected:', deviceId);
                setSelectedDeviceId(deviceId);
              }}
              deviceSelectionReady={deviceSelectionReady}
              showPlayButton={false}
              showDeleteButton={true}
              lastAction={lastAction}
              onRefreshDevices={refreshDevices}
              devicesLoading={devicesLoading}
              permissionState={permissionState}
            />

            <div className="mt-6 flex justify-center">
              <SaveRecordingButton
                onSave={() => {
                  console.log('[RecordingSheet] Save button clicked');
                  handleSaveRecording();
                }}
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
