
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "./RecordingSection";
import { RecordingActions } from "./RecordingActions";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface RecordingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingModal({ isOpen, onOpenChange }: RecordingModalProps) {
  const { toast } = useToast();
  const [modalReady, setModalReady] = useState(false);
  
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
    deviceSelectionReady,
  } = useRecording();

  useEffect(() => {
    if (isOpen) {
      console.log('[RecordingModal] Modal opened, initializing...');
      setModalReady(true);
    } else {
      // Reset on close
      if (isRecording) {
        console.log('[RecordingModal] Modal closed while recording, stopping recording');
        handleStopRecording().catch(err => {
          console.error('[RecordingModal] Error stopping recording on modal close:', err);
        });
      }
    }
  }, [isOpen, isRecording, handleStopRecording]);

  const handleTimeLimit = () => {
    handleStopRecording().then(() => {
      console.log('[RecordingModal] Recording stopped due to time limit');
      toast({
        title: "Time limit reached",
        description: "Recording has stopped due to time limit",
      });
    });
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
          {modalReady && (
            <>
              <RecordingSection
                isRecording={isRecording}
                isPaused={isPaused}
                audioUrl={audioUrl}
                mediaStream={mediaStream}
                isSystemAudio={isSystemAudio}
                handleStartRecording={handleStartRecording}
                handleStopRecording={() => handleStopRecording().then(() => {
                  console.log('[RecordingModal] Recording stopped manually');
                })}
                handlePauseRecording={handlePauseRecording}
                handleResumeRecording={handleResumeRecording}
                handleDelete={handleDelete}
                handleTimeLimit={handleTimeLimit}
                onSystemAudioChange={setIsSystemAudio}
                audioDevices={audioDevices}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={setSelectedDeviceId}
                deviceSelectionReady={deviceSelectionReady}
                showPlayButton={true}
                showDeleteButton={true}
              />

              <RecordingActions
                onSave={handleSaveRecording}
                isSaving={isSaving}
                isLoading={isLoading}
                isRecording={isRecording}
                hasRecording={hasRecording}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
