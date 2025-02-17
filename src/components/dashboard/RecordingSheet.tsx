
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSaveRecording } from "@/hooks/recording/useSaveRecording";
import { RecordingContent } from "@/components/record/RecordingContent";
import { useEffect } from "react";

interface RecordingSheetProps {
  onOpenChange?: (open: boolean) => void;
}

export function RecordingSheet({ onOpenChange }: RecordingSheetProps) {
  const { session } = useAuth();
  
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
    handleDelete,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    resetRecording,
  } = useRecording();

  const { handleSaveRecording, isSaveInProgress } = useSaveRecording({
    session,
    isRecording,
    audioUrl,
    mediaStream,
    handleStopRecording,
    resetRecording,
  });

  useEffect(() => {
    if (resetRecording) {
      resetRecording();
    }
  }, [resetRecording]);

  const handleTimeLimit = () => {
    if (isRecording) {
      handleStopRecording();
    }
  };

  const handleSave = async () => {
    const success = await handleSaveRecording();
    if (success && onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
      <SheetTitle className="text-lg font-semibold mb-2">Record Audio</SheetTitle>
      <RecordingContent
        isRecording={isRecording}
        isPaused={isPaused}
        audioUrl={audioUrl}
        mediaStream={mediaStream}
        isSystemAudio={isSystemAudio}
        isSaving={isSaving}
        isTranscribing={isTranscribing}
        isSaveInProgress={isSaveInProgress}
        handleStartRecording={handleStartRecording}
        handleStopRecording={handleStopRecording}
        handlePauseRecording={handlePauseRecording}
        handleResumeRecording={handleResumeRecording}
        handleDelete={handleDelete}
        handleTimeLimit={handleTimeLimit}
        handleSaveRecording={handleSave}
        setIsSystemAudio={setIsSystemAudio}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        setSelectedDeviceId={setSelectedDeviceId}
      />
    </SheetContent>
  );
}
