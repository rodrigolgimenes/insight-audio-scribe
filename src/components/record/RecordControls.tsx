
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause, Play, Trash2 } from "lucide-react";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDelete: () => void;
  onPlay?: () => void;
  disabled?: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
}

export function RecordControls({
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
}: RecordControlsProps) {
  const [buttonState, setButtonState] = useState<'idle' | 'recording' | 'paused'>('idle');

  // Update button state based on props
  useEffect(() => {
    if (isRecording) {
      setButtonState(isPaused ? 'paused' : 'recording');
    } else {
      setButtonState('idle');
    }
    
    console.log('[RecordControls] State updated:', { 
      isRecording, 
      isPaused, 
      hasRecording, 
      disabled,
      buttonState: isRecording ? (isPaused ? 'paused' : 'recording') : 'idle'
    });
  }, [isRecording, isPaused, hasRecording]);

  // Start recording handler
  const handleStartClick = () => {
    console.log('[RecordControls] Start button clicked, disabled:', disabled);
    if (!disabled) {
      onStartRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-center space-x-4">
        {buttonState === 'idle' && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={`h-16 w-16 rounded-full ${
              disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#4285F4] text-white hover:bg-[#3367D6]'
            }`}
            onClick={handleStartClick}
            disabled={disabled}
            aria-label="Start Recording"
          >
            <Mic className="h-8 w-8" />
          </Button>
        )}

        {buttonState === 'recording' && (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-16 w-16 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800"
              onClick={onPauseRecording}
              aria-label="Pause Recording"
            >
              <Pause className="h-8 w-8" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-16 w-16 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
              onClick={onStopRecording}
              aria-label="Stop Recording"
            >
              <Square className="h-8 w-8" />
            </Button>
          </>
        )}

        {buttonState === 'paused' && (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-16 w-16 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
              onClick={onResumeRecording}
              aria-label="Resume Recording"
            >
              <Play className="h-8 w-8" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-16 w-16 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
              onClick={onStopRecording}
              aria-label="Stop Recording"
            >
              <Square className="h-8 w-8" />
            </Button>
          </>
        )}

        {hasRecording && !isRecording && (
          <div className="flex space-x-4">
            {showPlayButton && onPlay && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-16 w-16 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
                onClick={onPlay}
                aria-label="Play Recording"
              >
                <Play className="h-8 w-8" />
              </Button>
            )}

            {showDeleteButton && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-16 w-16 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                onClick={onDelete}
                aria-label="Delete Recording"
              >
                <Trash2 className="h-8 w-8" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
