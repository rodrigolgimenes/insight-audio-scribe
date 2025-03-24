
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Square } from "lucide-react";

interface RecordingButtonsProps {
  isRecording: boolean;
  isPaused: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => Promise<any>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  selectedDeviceId: string | null;
  deviceSelectionReady?: boolean;
  onSave?: () => Promise<{ success: boolean }>;
}

export function RecordingButtons({
  isRecording,
  isPaused,
  handleStartRecording,
  handleStopRecording,
  handlePauseRecording,
  handleResumeRecording,
  selectedDeviceId,
  deviceSelectionReady = false,
  onSave
}: RecordingButtonsProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-center gap-2">
        {!isRecording ? (
          <Button
            onClick={handleStartRecording}
            disabled={!deviceSelectionReady || !selectedDeviceId}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="lg"
          >
            <Mic className="h-5 w-5 mr-2" />
            Start Recording
          </Button>
        ) : (
          <div className="flex gap-2">
            {!isPaused ? (
              <Button
                onClick={handlePauseRecording}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                size="lg"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={handleResumeRecording}
                className="bg-green-500 hover:bg-green-600 text-white"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Resume
              </Button>
            )}
            <Button
              onClick={async () => await handleStopRecording()}
              className="bg-red-500 hover:bg-red-600 text-white"
              size="lg"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop
            </Button>
          </div>
        )}
      </div>
      
      {onSave && isRecording === false && (
        <Button 
          onClick={onSave} 
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
          size="lg"
        >
          Save Recording
        </Button>
      )}
    </div>
  );
}
