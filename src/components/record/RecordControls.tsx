
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Square } from "lucide-react";
import { useState } from "react";

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
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('[RecordControls] Rendering with state:', { 
    isRecording, 
    isPaused, 
    hasRecording, 
    disabled,
    isProcessing
  });

  const handleRecordClick = async () => {
    console.log('[RecordControls] Record button clicked');
    if (disabled || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onStartRecording();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopClick = async () => {
    console.log('[RecordControls] Stop button clicked');
    if (disabled || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onStopRecording();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseResumeClick = () => {
    console.log('[RecordControls] Pause/Resume button clicked, isPaused:', isPaused);
    if (disabled || isProcessing) return;
    
    if (isPaused) {
      onResumeRecording();
    } else {
      onPauseRecording();
    }
  };

  return (
    <div className="flex items-center justify-center gap-6">
      {showPlayButton && hasRecording && !isRecording && (
        <Button
          size="icon"
          variant="outline"
          className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
          disabled={disabled || isProcessing}
          onClick={onPlay}
        >
          <Play className="w-6 h-6 text-[#4285F4]" />
        </Button>
      )}
      
      {isRecording ? (
        <>
          <Button
            size="icon"
            variant="default"
            className="w-20 h-20 rounded-full bg-[#4285F4] hover:bg-[#3367D6] active:bg-[#2A56C6]"
            onClick={handlePauseResumeClick}
            disabled={disabled || isProcessing}
          >
            {isPaused ? <Mic className="w-10 h-10" /> : <Pause className="w-10 h-10" />}
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            className="w-14 h-14 rounded-full border-2 bg-[#F8F9FE]"
            onClick={handleStopClick}
            disabled={disabled || isProcessing}
          >
            <Square className="w-6 h-6 text-[#4285F4]" />
          </Button>
        </>
      ) : (
        <Button
          size="icon"
          variant="default"
          className="w-20 h-20 rounded-full bg-[#4285F4] hover:bg-[#3367D6] active:bg-[#2A56C6] transition-colors"
          onClick={handleRecordClick}
          disabled={disabled || isProcessing}
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
          disabled={disabled || isProcessing}
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
