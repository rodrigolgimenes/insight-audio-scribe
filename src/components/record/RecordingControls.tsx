
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, StopCircle, Trash2, FileText } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  isLoading?: boolean;
  onSave?: () => void;
}

export const RecordingControls = ({
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
  isLoading = false,
  onSave
}: RecordingControlsProps) => {
  return (
    <div className="flex justify-center items-center gap-4 my-4">
      {!isRecording && !audioUrl && (
        <Button
          onClick={onStart}
          className="bg-palatinate-blue hover:bg-palatinate-blue/90 active:bg-palatinate-blue/80 text-white rounded-full px-8 py-6 h-auto"
          disabled={isLoading}
        >
          <Mic className="h-6 w-6" />
          <span className="sr-only">Start Recording</span>
        </Button>
      )}
      
      {isRecording && !isPaused && (
        <>
          <Button
            onClick={onPause}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-full p-4 h-auto"
            disabled={isLoading}
          >
            <Pause className="h-6 w-6" />
            <span className="sr-only">Pause Recording</span>
          </Button>
          
          <Button
            onClick={onStop}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 h-auto"
            disabled={isLoading}
          >
            <StopCircle className="h-6 w-6" />
            <span className="sr-only">Stop Recording</span>
          </Button>
        </>
      )}
      
      {isRecording && isPaused && (
        <>
          <Button
            onClick={onResume}
            className="bg-palatinate-blue hover:bg-palatinate-blue/90 text-white rounded-full p-4 h-auto"
            disabled={isLoading}
          >
            <Mic className="h-6 w-6" />
            <span className="sr-only">Resume Recording</span>
          </Button>
          
          <Button
            onClick={onStop}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 h-auto"
            disabled={isLoading}
          >
            <StopCircle className="h-6 w-6" />
            <span className="sr-only">Stop Recording</span>
          </Button>
        </>
      )}
      
      {audioUrl && !isRecording && (
        <div className="flex gap-4 justify-center w-full">
          {showDeleteButton && (
            <Button
              onClick={onDelete}
              variant="destructive"
              className="rounded-full w-12 h-12 flex items-center justify-center"
              disabled={isLoading}
            >
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Delete Recording</span>
            </Button>
          )}

          {onSave && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md w-48"
              onClick={onSave}
              disabled={isLoading}
            >
              <FileText className="h-5 w-5 mr-2" />
              <span>Transcribe Now</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
