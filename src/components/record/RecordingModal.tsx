
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRecording } from "@/hooks/useRecording";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { ModalRecordLoading } from "./ModalRecordLoading";
import { ModalRecordError } from "./ModalRecordError";
import { ModalRecordContent } from "./ModalRecordContent";
import { toast } from "sonner";

interface RecordingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingModal({ isOpen, onOpenChange }: RecordingModalProps) {
  PageLoadTracker.trackPhase('RecordingModal Render Start', true);
  
  const [modalReady, setModalReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  
  try {
    const recordingHook = useRecording();
    
    // Loading progress simulation
    useEffect(() => {
      if (isOpen && !modalReady) {
        let progress = 0;
        const interval = setInterval(() => {
          progress = Math.min(progress + 20, 100);
          setLoadingProgress(progress);
          if (progress === 100) {
            clearInterval(interval);
            setModalReady(true);
            toast.success("Audio recorder ready", {
              description: "You can now start recording"
            });
          }
        }, 100);

        return () => clearInterval(interval);
      }
    }, [isOpen, modalReady]);

    // Handle cleanup and error recovery
    useEffect(() => {
      if (!isOpen) {
        if (recordingHook.isRecording) {
          recordingHook.handleStopRecording().catch(console.error);
        }
        setModalReady(false);
        setError(null);
        setErrorDetails(null);
      }
    }, [isOpen, recordingHook]);

    // Handle initialization errors
    useEffect(() => {
      if (recordingHook.initError) {
        const errorMessage = recordingHook.initError.message;
        const errorStack = recordingHook.initError.stack || '';
        
        setError(errorMessage);
        setErrorDetails(errorStack);
        toast.error("Recording initialization failed", {
          description: errorMessage
        });
        
        if (recoveryAttempt < 2) {
          setTimeout(() => {
            setRecoveryAttempt(prev => prev + 1);
            setModalReady(false);
            toast.info(`Recovery attempt #${recoveryAttempt + 1}`, {
              description: "Attempting to reinitialize recorder"
            });
            setTimeout(() => setModalReady(true), 1000);
          }, 2000);
        }
      } else {
        setError(null);
        setErrorDetails(null);
      }
    }, [recordingHook.initError, recoveryAttempt]);

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          {!modalReady && isOpen ? (
            <ModalRecordLoading 
              loadingProgress={loadingProgress} 
              message={recoveryAttempt > 0 
                ? `Recovery attempt #${recoveryAttempt}... Please wait` 
                : "Initializing audio components..."}
            />
          ) : (
            <ModalRecordContent
              recordingHook={recordingHook}
              error={error}
              errorDetails={errorDetails}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack || "" : "";
    
    toast.error("Fatal recording error", {
      description: errorMessage
    });
    
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <ModalRecordError 
          errorMessage={`A critical error occurred while loading the recorder: ${errorMessage}`}
          details={errorDetails}
        />
      </Dialog>
    );
  }
}
