
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
  
  // Use the recording hook - simplified initialization
  const recordingHook = useRecording();
  
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
  } = recordingHook;

  // Initialize the modal when it opens
  useEffect(() => {
    console.log('[RecordingModal] Modal open state changed:', isOpen);
    if (isOpen) {
      // Short delay to ensure modal is fully rendered before initializing
      const timer = setTimeout(() => {
        setModalReady(true);
        console.log('[RecordingModal] Modal ready state set to true');
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Handle cleanup when modal closes
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

  // Handle initialization errors
  useEffect(() => {
    if (initError) {
      console.error('[RecordingModal] Initialization error:', initError);
      setError(initError.message);
    } else {
      setError(null);
    }
  }, [initError]);

  const isLoading = isSaving;
  const hasRecording = !!audioUrl;

  console.log('[RecordingModal] Render with state:', { 
    isOpen, 
    modalReady, 
    hasError: !!error,
    isRecording, 
    isPaused, 
    hasAudio: !!audioUrl 
  });

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
                }).catch(err => {
                  console.error('[RecordingModal] Error stopping recording:', err);
                  return { blob: null, duration: 0 };
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
