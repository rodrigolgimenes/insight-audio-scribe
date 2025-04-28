
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  deviceSelectionReady?: boolean;
  selectedDeviceId?: string | null;
  audioDevices?: any[];
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  disabled?: boolean;
}

export function RecordControls({
  isRecording,
  isPaused,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  permissionState = 'unknown',
  disabled = false
}: RecordControlsProps) {
  const canRecord = permissionState !== 'denied';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
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
          <div className="flex items-center gap-2">
            <Button
              onClick={onStopRecording}
              disabled={disabled}
              size="lg"
              className={cn(
                "rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 text-white",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Stop Recording"
            >
              <Square className="h-6 w-6" />
            </Button>
            
            {!isPaused ? (
              <Button
                onClick={onPauseRecording}
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
                onClick={onResumeRecording}
                disabled={disabled}
                size="lg"
                className={cn(
                  "rounded-full w-12 h-12 bg-green-500 hover:bg-green-600 text-white",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Resume Recording"
              >
                <Mic className="h-5 w-5" />
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
