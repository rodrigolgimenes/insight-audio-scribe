
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecording } from "@/hooks/useRecording";
import { useState, useEffect } from "react";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { ModalRecordLoading } from "./ModalRecordLoading";
import { ModalRecordError } from "./ModalRecordError";
import { ModalRecordContent } from "./ModalRecordContent";

interface RecordingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingModal({ isOpen, onOpenChange }: RecordingModalProps) {
  PageLoadTracker.trackPhase('RecordingModal Render Start', true);
  
  const [modalReady, setModalReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  try {
    PageLoadTracker.trackPhase('Recording Hook Initialization Start', true);
    const recordingHook = useRecording();
    PageLoadTracker.trackPhase('Recording Hook Initialization Complete', true);
    
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
        if (recordingHook.isRecording) {
          recordingHook.handleStopRecording().catch(err => {
            PageLoadTracker.trackPhase('Stop Recording on Modal Close', false, err.message);
          });
        }
        setModalReady(false);
        setError(null);
        PageLoadTracker.trackPhase('Modal Closed', true);
      }
    }, [isOpen, recordingHook.isRecording, recordingHook.handleStopRecording]);

    useEffect(() => {
      if (recordingHook.initError) {
        PageLoadTracker.trackPhase('Initialization Error Detected', false, recordingHook.initError.message);
        setError(recordingHook.initError.message);
      } else {
        setError(null);
      }
    }, [recordingHook.initError]);

    if (!modalReady && isOpen) {
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[600px]">
            <ModalRecordLoading loadingProgress={loadingProgress} />
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

          {modalReady && (
            <ModalRecordContent
              recordingHook={recordingHook}
              error={error}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  } catch (error) {
    PageLoadTracker.trackPhase('Fatal Error in Modal', false, error.message);
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <ModalRecordError errorMessage={error.message} />
        </DialogContent>
      </Dialog>
    );
  }
}
