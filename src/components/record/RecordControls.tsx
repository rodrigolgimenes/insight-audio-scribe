
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  deviceSelectionReady: boolean;
  showLastAction?: boolean;
  lastAction?: { 
    action: string; 
    timestamp: number; 
    success: boolean;
    error?: string;
  };
}

export function RecordControls({
  isRecording,
  isPaused,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  deviceSelectionReady,
  showLastAction = false,
  lastAction
}: RecordControlsProps) {
  const [buttonPressed, setButtonPressed] = useState<string | null>(null);
  const [clickTime, setClickTime] = useState<number | null>(null);

  const handleButtonClick = (action: string, callback: () => void) => {
    setButtonPressed(action);
    setClickTime(Date.now());
    
    console.log(`[RecordControls] Button clicked: ${action} at ${new Date().toISOString()}`);
    try {
      callback();
      console.log(`[RecordControls] Callback executed for: ${action}`);
    } catch (error) {
      console.error(`[RecordControls] Error in button action ${action}:`, error);
    }
  };

  useEffect(() => {
    let timeoutId: number;
    if (buttonPressed) {
      timeoutId = window.setTimeout(() => {
        setButtonPressed(null);
        setClickTime(null);
      }, 1000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [buttonPressed]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <Button
            onClick={() => handleButtonClick('start', onStartRecording)}
            disabled={!deviceSelectionReady || isRecording}
            size="lg"
            className={cn(
              "rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 text-white",
              buttonPressed === 'start' && "animate-pulse",
              !deviceSelectionReady && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Start Recording"
            data-test-id="start-recording-button"
          >
            <Mic className="h-8 w-8" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleButtonClick('stop', onStopRecording)}
              size="lg"
              className={cn(
                "rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 text-white",
                buttonPressed === 'stop' && "animate-pulse"
              )}
              aria-label="Stop Recording"
            >
              <Square className="h-6 w-6" />
            </Button>
            
            {!isPaused ? (
              <Button
                onClick={() => handleButtonClick('pause', onPauseRecording)}
                size="lg"
                className={cn(
                  "rounded-full w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white",
                  buttonPressed === 'pause' && "animate-pulse"
                )}
                aria-label="Pause Recording"
              >
                <Pause className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={() => handleButtonClick('resume', onResumeRecording)}
                size="lg"
                className={cn(
                  "rounded-full w-12 h-12 bg-green-500 hover:bg-green-600 text-white",
                  buttonPressed === 'resume' && "animate-pulse"
                )}
                aria-label="Resume Recording"
              >
                <Play className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Status and Diagnostic Information */}
      <div className="text-xs text-gray-500 mt-2">
        <div>Status: {isRecording ? (isPaused ? "Paused" : "Recording") : "Ready"}</div>
        {!deviceSelectionReady && (
          <div className="text-amber-500">Waiting for microphone permission...</div>
        )}
        {showLastAction && lastAction && (
          <div className={cn(
            "text-xs mt-1",
            lastAction.success ? "text-green-600" : "text-red-600"
          )}>
            Last action: {lastAction.action} - {new Date(lastAction.timestamp).toLocaleTimeString()} - 
            {lastAction.success ? " Success" : " Failed"}
            {lastAction.error && <div className="text-red-500">{lastAction.error}</div>}
          </div>
        )}
        {clickTime && (
          <div className="text-xs text-gray-400">
            Last click: {new Date(clickTime).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
