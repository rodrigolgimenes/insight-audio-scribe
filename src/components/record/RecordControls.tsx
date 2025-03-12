
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, StopCircle } from "lucide-react";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void | Promise<void>;
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
          className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
          disabled={!hasRecording || isRecording || disabled}
          onClick={onPlay}
        >
          <Play className="w-6 h-6 text-[#9b87f5]" />
        </Button>
      )}
      
      {isRecording ? (
        <>
          <Button
            size="icon"
            variant="outline"
            className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
            onClick={() => onStopRecording()}
            disabled={disabled}
          >
            <StopCircle className="w-6 h-6 text-red-500" />
          </Button>
          
          <Button
            size="icon"
            variant="default"
            className="w-20 h-20 rounded-full bg-[#9b87f5] hover:bg-[#7E69AB]"
            onClick={isPaused ? onResumeRecording : onPauseRecording}
            disabled={disabled}
          >
            {isPaused ? <Mic className="w-10 h-10" /> : <Pause className="w-10 h-10" />}
          </Button>
        </>
      ) : (
        <Button
          size="icon"
          variant="default"
          className="w-20 h-20 rounded-full bg-[#9b87f5] hover:bg-[#7E69AB]"
          onClick={onStartRecording}
          disabled={disabled}
        >
          <Mic className="w-10 h-10" />
        </Button>
      )}
      
      {showDeleteButton && hasRecording && !isRecording && (
        <Button
          size="icon"
          variant="outline"
          className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
          onClick={onDelete}
          disabled={disabled}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-500">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </Button>
      )}
    </div>
  );
};
