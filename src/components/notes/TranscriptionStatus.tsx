
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { getStatusInfo } from "./transcription/getStatusInfo";
import { ErrorHelpers } from "./transcription/ErrorHelpers";
import { RetryButton } from "./transcription/RetryButton";
import { StatusHeader } from "./transcription/StatusHeader";
import { useToast } from "@/components/ui/use-toast";

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
  
  // Convert milliseconds to minutes
  const durationInMinutes = duration && Math.round(duration / 1000 / 60);
  const isLongAudio = durationInMinutes && durationInMinutes > 20;
  
  const statusInfo = getStatusInfo(status);
  const { message, icon, color } = statusInfo;
  
  const handleRetry = async () => {
    if (noteId) {
      try {
        const success = await retryTranscription(noteId);
        if (success) {
          toast({
            title: "Retry initiated",
            description: "The transcription process has been restarted.",
            variant: "default",
          });
        } else {
          throw new Error("Failed to restart transcription");
        }
      } catch (error) {
        console.error('Error retrying transcription:', error);
        toast({
          title: "Retry failed",
          description: "Could not restart the transcription process. Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

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
      
      {status === 'error' && <ErrorHelpers error={error} />}
      
      {showRetryButton && (
        <div className="mt-3">
          <RetryButton onRetry={handleRetry} />
        </div>
      )}
      
      {showProgress && (
        <Progress value={progress} className="w-full mt-2" />
      )}
    </Card>
  );
};
