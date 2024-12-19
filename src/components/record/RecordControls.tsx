import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Trash } from "lucide-react";

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
}: RecordControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-6">
      <Button
        size="icon"
        variant="outline"
        className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
        disabled={!hasRecording || isRecording}
        onClick={onPlay}
      >
        <Play className="w-6 h-6 text-primary" />
      </Button>
      
      {isRecording ? (
        <Button
          size="icon"
          variant="default"
          className="w-20 h-20 rounded-full bg-[#E91E63] hover:bg-[#D81B60]"
          onClick={isPaused ? onResumeRecording : onPauseRecording}
        >
          {isPaused ? <Play className="w-10 h-10" /> : <Pause className="w-10 h-10" />}
        </Button>
      ) : (
        <Button
          size="icon"
          variant="default"
          className="w-20 h-20 rounded-full bg-[#E91E63] hover:bg-[#D81B60]"
          onClick={onStartRecording}
        >
          <Mic className="w-10 h-10" />
        </Button>
      )}
      
      <Button
        size="icon"
        variant="outline"
        className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
        onClick={onDelete}
        disabled={isRecording}
      >
        <Trash className="w-6 h-6 text-primary" />
      </Button>
    </div>
  );
};