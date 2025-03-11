
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { getStatusInfo } from "./transcription/getStatusInfo";
import { TranscriptError } from "./TranscriptError";
import { RetryButton } from "./transcription/RetryButton";
import { StatusHeader } from "./transcription/StatusHeader";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface TranscriptionStatusProps {
  status: string;
  progress: number;
  error?: string;
  duration?: number;
  noteId?: string;
}

export const TranscriptionStatus = ({
  status,
  progress,
  error,
  duration,
  noteId
}: TranscriptionStatusProps) => {
  const { retryTranscription } = useNoteTranscription();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Convert milliseconds to minutes
  const durationInMinutes = duration && Math.round(duration / 1000 / 60);
  const isLongAudio = durationInMinutes && durationInMinutes > 30;
  
  const statusInfo = getStatusInfo(status);
  const { message, icon, color } = statusInfo;
  
  const handleRetry = async () => {
    if (!noteId) return;
    
    setIsRetrying(true);
    
    try {
      const success = await retryTranscription(noteId);
      if (success) {
        toast({
          title: "Retry initiated",
          description: "Transcription process has been restarted.",
          variant: "default",
        });
      } else {
        throw new Error("Failed to restart transcription");
      }
    } catch (error) {
      console.error('Error retrying transcription:', error);
      toast({
        title: "Failed to retry",
        description: "Could not restart the transcription process. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Show retry button for errors and pending status (after a delay)
  const showRetryButton = (status === 'error' || status === 'pending') && noteId;
  const showProgress = status !== 'completed' && status !== 'error' && progress > 0;
  
  return (
    <Card className="p-4 mb-4 relative">
      <StatusHeader 
        icon={icon}
        message={message}
        color={color}
        isLongAudio={!!isLongAudio}
        durationInMinutes={durationInMinutes}
        status={status}
        progress={progress}
      />
      
      {status === 'error' && <TranscriptError error={error} noteId={noteId} />}
      
      {showRetryButton && !status.includes('error') && (
        <div className="mt-3">
          <RetryButton onRetry={handleRetry} isDisabled={isRetrying} />
        </div>
      )}
      
      {showProgress && (
        <Progress value={progress} className="w-full mt-2" />
      )}
    </Card>
  );
};
