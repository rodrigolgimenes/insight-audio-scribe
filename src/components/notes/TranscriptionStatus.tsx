
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNoteTranscription } from "@/hooks/notes/useNoteTranscription";
import { getStatusInfo } from "./transcription/getStatusInfo";
import { ErrorHelpers } from "./transcription/ErrorHelpers";
import { RetryButton } from "./transcription/RetryButton";
import { StatusHeader } from "./transcription/StatusHeader";

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
  
  // Convert milliseconds to minutes
  const durationInMinutes = duration && Math.round(duration / 1000 / 60);
  const isLongAudio = durationInMinutes && durationInMinutes > 20;
  
  const statusInfo = getStatusInfo(status);
  const { message, icon, color } = statusInfo;
  
  const handleRetry = async () => {
    if (noteId) {
      const success = await retryTranscription(noteId);
      console.log('Retry transcription result:', success);
    }
  };

  const showRetryButton = status === 'error' && noteId;
  const showProgress = status !== 'completed' && status !== 'error' && progress > 0;
  
  return (
    <Card className="p-4 mb-4">
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
        <RetryButton onRetry={handleRetry} />
      )}
      
      {showProgress && (
        <Progress value={progress} className="w-full mt-2" />
      )}
    </Card>
  );
};
