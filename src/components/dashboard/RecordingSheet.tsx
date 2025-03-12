
import { useEffect } from "react";
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function RecordingSheet() {
  const { toast } = useToast();
  
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
    lastAction
  } = useRecording();

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
      hasInitError: !!initError
    });
  }, [isRecording, isPaused, audioUrl, deviceSelectionReady, selectedDeviceId, audioDevices.length, recordingAttemptsCount, initError]);

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
              Tentativas de iniciar gravação: {recordingAttemptsCount}
              {lastAction && (
                <div className="text-xs mt-1">
                  Última ação: {lastAction.action} - {new Date(lastAction.timestamp).toLocaleTimeString()} - 
                  {lastAction.success ? 
                    <span className="text-green-600"> Sucesso</span> : 
                    <span className="text-red-600"> Falha</span>}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

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
      </div>
    </SheetContent>
  );
}
