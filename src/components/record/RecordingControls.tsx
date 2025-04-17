
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Pause, Play, Save, StopCircle, Trash } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import { Progress } from "@/components/ui/progress";
import { RecordingValidator } from "@/utils/audio/recordingValidator";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  onStart: () => void;
  onStop: () => Promise<any>;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  onSave?: () => Promise<any>;
  isSaving?: boolean;
  isLoading?: boolean;
  processingProgress?: number;
  processingStage?: string;
  disabled?: boolean;
}

export function RecordingControls({
  isRecording,
  isPaused,
  audioUrl,
  onStart,
  onStop,
  onPause,
  onResume,
  onDelete,
  showPlayButton = true,
  showDeleteButton = true,
  onSave,
  isSaving = false,
  isLoading = false,
  processingProgress = 0,
  processingStage = "",
  disabled = false
}: RecordingControlsProps) {
  
  // Check if we have a valid recording or playable audio
  const hasRecording = audioUrl !== null;
  
  // Determine appropriate button to display
  const renderRecordingButton = () => {
    if (isLoading) {
      // Show a loading state
      return (
        <Button
          onClick={() => {}}
          disabled={true}
          variant="outline"
          className="w-full h-12 bg-gray-100"
        >
          <div className="animate-spin h-5 w-5 mr-2 border-2 border-b-transparent rounded-full"></div>
          Loading...
        </Button>
      );
    }

    if (!isRecording) {
      // Show the Start Recording button
      return (
        <Button
          onClick={onStart}
          disabled={disabled}
          className="w-full h-12 bg-green-500 hover:bg-green-600 text-white"
        >
          <Mic className="h-5 w-5 mr-2" />
          Start Recording
        </Button>
      );
    }

    if (isPaused) {
      // Show the Resume button
      return (
        <Button
          onClick={onResume}
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Play className="h-5 w-5 mr-2" />
          Resume
        </Button>
      );
    }

    // Show the Pause/Stop controls when recording
    return (
      <div className="flex gap-2 w-full">
        <Button
          onClick={onPause}
          variant="outline"
          className="flex-1 h-12 border-amber-500 text-amber-500 hover:bg-amber-50"
        >
          <Pause className="h-5 w-5 mr-2" />
          Pause
        </Button>
        <Button
          onClick={onStop}
          className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white"
        >
          <StopCircle className="h-5 w-5 mr-2" />
          Stop
        </Button>
      </div>
    );
  };

  // Render additional options when we have a recording
  const renderPostRecordingOptions = () => {
    if (!hasRecording || isRecording) {
      return null;
    }

    return (
      <div className="mt-4 space-y-4">
        {showPlayButton && <AudioPlayer audioUrl={audioUrl} />}
        
        <div className="flex gap-2">
          {showDeleteButton && (
            <Button
              onClick={onDelete}
              variant="outline"
              className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
              disabled={isSaving}
            >
              <Trash className="h-5 w-5 mr-2" />
              Delete
            </Button>
          )}
          
          {onSave && (
            <Button
              onClick={onSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-b-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save
                </>
              )}
            </Button>
          )}
        </div>
        
        {isSaving && processingProgress > 0 && (
          <div className="space-y-2">
            <Progress value={processingProgress} className="h-2" />
            <p className="text-xs text-gray-500">{processingStage || "Processing..."}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderRecordingButton()}
      {renderPostRecordingOptions()}
    </div>
  );
}
