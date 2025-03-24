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
import { PermissionState as CapturePermissionState } from "@/hooks/recording/capture/types";

type LastActionType = string | { 
  action: string; 
  timestamp: number; 
  success: boolean; 
  error?: string 
};

interface ModalRecordContentProps {
  closeModal: () => void;
  onSuccess?: () => void;
  lastAction?: LastActionType;
}

export function ModalRecordContent({
  closeModal, 
  onSuccess,
  lastAction
}: ModalRecordContentProps) {
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
    lastAction: lastActionState,
    permissionState: recordingPermissionState,
    handleSaveRecording,
    devicesLoading,
    refreshDevices
  } = useRecording();

  const handleSaveClick = async (): Promise<{ success: boolean }> => {
    try {
      await handleSaveRecording();
      onSuccess?.();
      closeModal();
      return { success: true };
    } catch (err: any) {
      setError(err.message || "Failed to save recording");
      return { success: false };
    }
  };

  const handleRefreshDevices = async (): Promise<void> => {
    try {
      if (refreshDevices) {
        await refreshDevices();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing devices:", error);
      return Promise.reject(error);
    }
  };

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
        lastAction={lastActionState}
        permissionState={permissionStateForComponent}
        showPlayButton={false}
        onSave={handleSaveClick}
        devicesLoading={devicesLoading}
        onRefreshDevices={handleRefreshDevices}
        suppressMessages={true} // Always suppress microphone messages
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
