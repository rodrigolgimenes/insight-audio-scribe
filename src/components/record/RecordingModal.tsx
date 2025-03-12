
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
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { Progress } from "@/components/ui/progress";

interface RecordingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingModal({ isOpen, onOpenChange }: RecordingModalProps) {
  PageLoadTracker.trackPhase('RecordingModal Render Start', true);
  
  const { toast } = useToast();
  const [modalReady, setModalReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  try {
    PageLoadTracker.trackPhase('Recording Hook Initialization Start', true);
    const recordingHook = useRecording();
    PageLoadTracker.trackPhase('Recording Hook Initialization Complete', true);
    
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

    // Loading progress simulation
    useEffect(() => {
      if (isOpen && !modalReady) {
        let progress = 0;
        const interval = setInterval(() => {
          if (progress < 100) {
            progress += 20;
            setLoadingProgress(progress);
          } else {
            clearInterval(interval);
          }
        }, 100);

        return () => clearInterval(interval);
      }
    }, [isOpen, modalReady]);

    useEffect(() => {
      if (isOpen) {
        PageLoadTracker.trackPhase('Modal Opened', true);
        const timer = setTimeout(() => {
          setModalReady(true);
          PageLoadTracker.trackPhase('Modal Ready State Set', true);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        if (isRecording) {
          handleStopRecording().catch(err => {
            PageLoadTracker.trackPhase('Stop Recording on Modal Close', false, err.message);
          });
        }
        setModalReady(false);
        setError(null);
        PageLoadTracker.trackPhase('Modal Closed', true);
      }
    }, [isOpen, isRecording, handleStopRecording]);

    useEffect(() => {
      if (initError) {
        PageLoadTracker.trackPhase('Initialization Error Detected', false, initError.message);
        setError(initError.message);
      } else {
        setError(null);
      }
    }, [initError]);

    const isLoading = isSaving;
    const hasRecording = !!audioUrl;

    if (!modalReady && isOpen) {
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[600px]">
            <div className="flex flex-col items-center justify-center py-8">
              <h2 className="text-xl font-semibold mb-4">Loading Recording Components</h2>
              <Progress value={loadingProgress} className="w-full max-w-md mb-4" />
              <p className="text-sm text-muted-foreground">
                Initializing audio recorder...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

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
                  handleStopRecording={() => handleStopRecording().catch(err => {
                    PageLoadTracker.trackPhase('Stop Recording Error', false, err.message);
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
  } catch (error) {
    PageLoadTracker.trackPhase('Fatal Error in Modal', false, error.message);
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A critical error occurred while loading the recorder: {error.message}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }
}
