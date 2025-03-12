
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "./RecordingSection";
import { RecordingActions } from "./RecordingActions";

interface RecordingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingModal({ isOpen, onOpenChange }: RecordingModalProps) {
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isSystemAudio,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useRecording();

  const handleTimeLimit = () => {
    handleStopRecording().then(() => {});
  };

  const isLoading = isSaving;
  const hasRecording = !!audioUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Audio</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <RecordingSection
            isRecording={isRecording}
            isPaused={isPaused}
            audioUrl={audioUrl}
            mediaStream={mediaStream}
            isSystemAudio={isSystemAudio}
            handleStartRecording={handleStartRecording}
            handleStopRecording={() => handleStopRecording().then(() => {})}
            handlePauseRecording={handlePauseRecording}
            handleResumeRecording={handleResumeRecording}
            handleDelete={handleDelete}
            handleTimeLimit={handleTimeLimit}
            onSystemAudioChange={setIsSystemAudio}
            audioDevices={audioDevices}
            selectedDeviceId={selectedDeviceId}
            onDeviceSelect={setSelectedDeviceId}
            showPlayButton={false}
            showDeleteButton={false}
          />

          <RecordingActions
            onSave={handleSaveRecording}
            isSaving={isSaving}
            isLoading={isLoading}
            isRecording={isRecording}
            hasRecording={hasRecording}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
