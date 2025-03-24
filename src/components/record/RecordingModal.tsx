
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRecording } from "@/hooks/useRecording";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { ModalRecordError } from "./ModalRecordError";
import { ModalRecordContent } from "./ModalRecordContent";
import { toast } from "sonner";

interface RecordingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordingModal({ isOpen, onOpenChange }: RecordingModalProps) {
  PageLoadTracker.trackPhase('RecordingModal Render Start', true);
  
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  
  try {
    const recordingHook = useRecording();
    
    // Handle cleanup and error recovery
    useEffect(() => {
      if (!isOpen) {
        if (recordingHook.isRecording) {
          recordingHook.handleStopRecording().catch(console.error);
        }
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
            toast.info(`Recovery attempt #${recoveryAttempt + 1}`, {
              description: "Attempting to reinitialize recorder"
            });
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
          <ModalRecordContent
            closeModal={() => onOpenChange(false)}
            onSuccess={() => {
              toast.success("Recording saved successfully");
              onOpenChange(false);
            }}
          />
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
