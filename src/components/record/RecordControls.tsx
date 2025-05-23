
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  handleStartRecording: () => void;
  handleTranscribe: () => void;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  disabled?: boolean;
}

export function RecordControls({
  isRecording,
  isPaused,
  handleStartRecording,
  handleTranscribe,
  handlePauseRecording,
  handleResumeRecording,
  permissionState = 'unknown',
  disabled = false
}: RecordControlsProps) {
  const canRecord = permissionState !== 'denied';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <Button
            onClick={handleStartRecording}
            disabled={!canRecord || disabled}
            size="lg"
            className={cn(
              "rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 text-white",
              (!canRecord || disabled) && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Start Recording"
          >
            <Mic className="h-8 w-8" />
          </Button>
        ) : (
          <div className="flex items-center gap-4">
            <Button
              onClick={handleTranscribe}
              disabled={disabled}
              size="lg"
              className={cn(
                "rounded-full w-24 h-24 bg-green-500 hover:bg-green-600 text-white flex flex-col items-center justify-center text-lg font-bold",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Transcribe Recording"
            >
              TRANSCRIBE
            </Button>
            
            {!isPaused ? (
              <Button
                onClick={handlePauseRecording}
                disabled={disabled}
                size="lg"
                className={cn(
                  "rounded-full w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Pause Recording"
              >
                <Pause className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={handleResumeRecording}
                disabled={disabled}
                size="lg"
                className={cn(
                  "rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Resume Recording"
              >
                <Play className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {permissionState === 'denied' && (
        <div className="text-sm text-red-500">
          Please enable microphone access in your browser settings
        </div>
      )}
    </div>
  );
}
