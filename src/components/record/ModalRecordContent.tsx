import { useEffect, useState } from "react";
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
    permissionState,
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
        permissionState={permissionState}
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
