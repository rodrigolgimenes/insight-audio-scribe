import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordingValidator } from "@/utils/audio/recordingValidator";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  deviceSelectionReady: boolean;
  selectedDeviceId?: string | null;
  audioDevices?: any[];
  showLastAction?: boolean;
  lastAction?: { 
    action: string; 
    timestamp: number; 
    success: boolean;
    error?: string;
  };
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
  deviceSelectionReady,
  selectedDeviceId = null,
  audioDevices = [],
  showLastAction = false,
  lastAction,
  permissionState = 'unknown',
  disabled = false
}: RecordControlsProps) {
  const [buttonPressed, setButtonPressed] = useState<string | null>(null);
  const [canStart, setCanStart] = useState(false);
  
  useEffect(() => {
    if (isRecording) return;
    
    const diagnostics = RecordingValidator.validatePrerequisites({
      selectedDeviceId,
      deviceSelectionReady,
      audioDevices,
      permissionState
    });
    
    setCanStart(diagnostics.canStartRecording);
  }, [deviceSelectionReady, selectedDeviceId, audioDevices, isRecording, permissionState]);

  const handleButtonClick = (action: string, callback: () => void) => {
    setButtonPressed(action);
    
    console.log(`[RecordControls] Button clicked: ${action} at ${new Date().toISOString()}`);
    
    try {
      callback();
    } catch (error) {
      console.error(`[RecordControls] Error in button action ${action}:`, error);
    }
  };

  useEffect(() => {
    let timeoutId: number;
    if (buttonPressed) {
      timeoutId = window.setTimeout(() => {
        setButtonPressed(null);
      }, 1000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [buttonPressed]);

  const getStatusMessage = () => {
    if (disabled) {
      return "Recording is disabled - please login first";
    }

    if (canStart) {
      return "Microphone selected and ready";
    }
    
    if (permissionState === 'denied') {
      return "Microphone access denied - check browser settings";
    }
    
    if (permissionState === 'prompt') {
      return "Click 'Allow' when prompted for microphone access";
    }
    
    if (audioDevices.length === 0) {
      return "No microphones detected";
    }
    
    if (!selectedDeviceId) {
      return "Please select a microphone";
    }
    
    const deviceExists = selectedDeviceId ? 
      audioDevices.some(d => d.deviceId === selectedDeviceId) : false;
    
    if (!deviceExists) {
      return "Selected microphone not found - please select another";
    }
    
    return "Waiting for microphone permission or device selection...";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <Button
            onClick={() => handleButtonClick('start', onStartRecording)}
            disabled={!canStart || disabled}
            size="lg"
            className={cn(
              "rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 text-white",
              buttonPressed === 'start' && "animate-pulse",
              (!canStart || disabled) && "opacity-50 cursor-not-allowed"
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
              disabled={disabled}
              size="lg"
              className={cn(
                "rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 text-white",
                buttonPressed === 'stop' && "animate-pulse",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Stop Recording"
            >
              <Square className="h-6 w-6" />
            </Button>
            
            {!isPaused ? (
              <Button
                onClick={() => handleButtonClick('pause', onPauseRecording)}
                disabled={disabled}
                size="lg"
                className={cn(
                  "rounded-full w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white",
                  buttonPressed === 'pause' && "animate-pulse",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Pause Recording"
              >
                <Pause className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={() => handleButtonClick('resume', onResumeRecording)}
                disabled={disabled}
                size="lg"
                className={cn(
                  "rounded-full w-12 h-12 bg-green-500 hover:bg-green-600 text-white",
                  buttonPressed === 'resume' && "animate-pulse",
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
      
      <div className="text-sm text-gray-500 mt-2">
        <div>Status: {isRecording ? (isPaused ? "Paused" : "Recording") : "Ready"}</div>
        <div className={canStart && !disabled ? "text-green-500" : "text-amber-500"}>
          {getStatusMessage()}
        </div>
      </div>
    </div>
  );
}
