
import { useState } from "react";
import { useRecording } from "@/hooks/useRecording";
import {
  SheetClose,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RecordingSection } from "@/components/record/RecordingSection";
import { PermissionState as CapturePermissionState } from "@/hooks/recording/capture/permissions/types";

interface ModalRecordContentProps {
  closeModal: () => void;
  onSuccess?: () => void;
}

export const ModalRecordContent = ({ 
  closeModal, 
  onSuccess
}: ModalRecordContentProps) => {
  const [error, setError] = useState<string | null>(null);
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
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
    lastAction,
    permissionState: recordingPermissionState,
    handleSaveRecording
  } = useRecording();

  const handleSaveClick = async () => {
    try {
      await handleSaveRecording();
      onSuccess?.();
      closeModal();
    } catch (err: any) {
      setError(err.message || "Failed to save recording");
    }
  };

  // Get the type from RecordingSection props
  const permissionStateForComponent = recordingPermissionState === 'unknown' 
    ? 'prompt' // Map 'unknown' to 'prompt' which is acceptable by RecordingSection
    : recordingPermissionState;

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

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
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={setSelectedDeviceId}
        deviceSelectionReady={deviceSelectionReady}
        lastAction={lastAction}
        permissionState={permissionStateForComponent}
        showPlayButton={false}
        onSave={isRecording ? undefined : handleSaveClick}
      />

      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </SheetClose>
      </SheetFooter>
    </div>
  );
};
