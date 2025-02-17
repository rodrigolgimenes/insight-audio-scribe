
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play } from "lucide-react";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDelete: () => void;
  onPlay: () => void;
  disabled?: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
}

export const RecordControls = ({
  isRecording,
  isPaused,
  hasRecording,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDelete,
  onPlay,
  disabled = false,
  showPlayButton = true,
  showDeleteButton = true,
}: RecordControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-6">
      {showPlayButton && (
        <Button
          size="icon"
          variant="outline"
          className="w-14 h-14 rounded-full border-2 bg-primary-light"
          disabled={!hasRecording || isRecording || disabled}
          onClick={onPlay}
        >
          <Play className="w-6 h-6 text-primary" />
        </Button>
      )}
      
      {isRecording ? (
        <Button
          size="icon"
          variant="default"
          className="w-20 h-20 rounded-full bg-primary hover:bg-primary-dark"
          onClick={isPaused ? onResumeRecording : onPauseRecording}
          disabled={disabled}
        >
          {isPaused ? <Mic className="w-10 h-10" /> : <Pause className="w-10 h-10" />}
        </Button>
      ) : (
        <Button
          size="icon"
          variant="default"
          className="w-20 h-20 rounded-full bg-primary hover:bg-primary-dark"
          onClick={onStartRecording}
          disabled={disabled}
        >
          <Mic className="w-10 h-10" />
        </Button>
      )}
    </div>
  );
};
