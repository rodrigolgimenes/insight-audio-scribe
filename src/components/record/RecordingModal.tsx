
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
    // Use a try-catch to handle potential initialization errors
    let recordingHook;
    try {
      PageLoadTracker.trackPhase('Recording Hook Initialization Start', true);
      recordingHook = useRecording();
      PageLoadTracker.trackPhase('Recording Hook Initialization Complete', true);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error initializing recorder';
      console.error("Failed to initialize recording hook:", e);
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent>
            <ModalRecordError 
              errorMessage={`A critical error occurred while loading the recorder: ${errorMessage}`}
              details={e instanceof Error ? e.stack : undefined}
            />
          </DialogContent>
        </Dialog>
      );
    }

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

    // Handle initialization and errors
    useEffect(() => {
      if (isOpen) {
        PageLoadTracker.trackPhase('Modal Opened', true);
        
        // Reset error state when modal is opened
        setError(null);
        setErrorDetails(null);
        
        const timer = setTimeout(() => {
          setModalReady(true);
          PageLoadTracker.trackPhase('Modal Ready State Set', true);
          
          // Show toast when the recorder is ready
          toast.success("Audio recorder ready", {
            description: "You can now start recording"
          });
        }, 500); // Increased delay to ensure components are ready
        
        return () => clearTimeout(timer);
      } else {
        if (recordingHook.isRecording) {
          recordingHook.handleStopRecording().catch(err => {
            PageLoadTracker.trackPhase('Stop Recording on Modal Close', false, err.message);
            console.error("Error stopping recording on modal close:", err);
          });
        }
        setModalReady(false);
        setError(null);
        setErrorDetails(null);
        PageLoadTracker.trackPhase('Modal Closed', true);
      }
    }, [isOpen, recordingHook.isRecording, recordingHook.handleStopRecording]);

    // Handle initialization errors
    useEffect(() => {
      if (recordingHook.initError) {
        const errorMessage = recordingHook.initError.message;
        const errorStack = recordingHook.initError.stack || '';
        
        PageLoadTracker.trackPhase('Initialization Error Detected', false, errorMessage);
        setError(errorMessage);
        setErrorDetails(errorStack);
        
        // Log detailed information for debugging
        console.error("[RecordingModal] Initialization error:", recordingHook.initError);
        console.log("[RecordingModal] Audio devices:", recordingHook.audioDevices);
        console.log("[RecordingModal] Device selection ready:", recordingHook.deviceSelectionReady);
        console.log("[RecordingModal] Selected device ID:", recordingHook.selectedDeviceId);
        
        // Show error toast
        toast.error("Recording initialization failed", {
          description: errorMessage
        });
        
        // Auto-recovery attempt logic
        if (recoveryAttempt < 2) {
          const recoveryTimer = setTimeout(() => {
            setRecoveryAttempt(prev => prev + 1);
            setModalReady(false); // Reset to loading state
            PageLoadTracker.trackPhase('Auto-recovery attempt', true, `Attempt #${recoveryAttempt + 1}`);
            
            toast.info("Attempting to reinitialize recorder", {
              description: `Recovery attempt #${recoveryAttempt + 1}`
            });
            
            // Force a delay before setting ready again
            setTimeout(() => {
              setModalReady(true);
            }, 1000);
          }, 2000);
          
          return () => clearTimeout(recoveryTimer);
        }
      } else {
        setError(null);
        setErrorDetails(null);
      }
    }, [recordingHook.initError, recoveryAttempt]);

    if (!modalReady && isOpen) {
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[600px]">
            <ModalRecordLoading 
              loadingProgress={loadingProgress} 
              message={recoveryAttempt > 0 
                ? `Recovery attempt #${recoveryAttempt}... Please wait` 
                : "Initializing audio components..."}
            />
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
              errorDetails={errorDetails}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack || "" : "";
    
    PageLoadTracker.trackPhase('Fatal Error in Modal', false, errorMessage);
    console.error("[RecordingModal] Fatal error:", error);
    
    // Show fatal error toast
    toast.error("Fatal recording error", {
      description: errorMessage
    });
    
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <ModalRecordError 
            errorMessage={`A critical error occurred while loading the recorder: ${errorMessage}`}
            details={errorDetails}
          />
        </DialogContent>
      </Dialog>
    );
  }
}
