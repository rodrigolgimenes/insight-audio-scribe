
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RecordingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingModal({ isOpen, onOpenChange }: RecordingModalProps) {
  const { toast } = useToast();
  const [modalReady, setModalReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    lastAction,
    initError
  } = useRecording();

  useEffect(() => {
    if (isOpen) {
      console.log('[RecordingModal] Modal opened, initializing...');
      // Short delay to ensure modal is rendered before initializing
      const timer = setTimeout(() => {
        setModalReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Reset on close
      if (isRecording) {
        console.log('[RecordingModal] Modal closed while recording, stopping recording');
        handleStopRecording().catch(err => {
          console.error('[RecordingModal] Error stopping recording on modal close:', err);
        });
      }
      setModalReady(false);
      setError(null);
    }
  }, [isOpen, isRecording, handleStopRecording]);

  useEffect(() => {
    if (initError) {
      setError(initError.message);
    } else {
      setError(null);
    }
  }, [initError]);

  const isLoading = isSaving;
  const hasRecording = !!audioUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Audio</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
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
                onSystemAudioChange={setIsSystemAudio}
                audioDevices={audioDevices}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={setSelectedDeviceId}
                deviceSelectionReady={deviceSelectionReady}
                showPlayButton={true}
                showDeleteButton={true}
                lastAction={lastAction}
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
