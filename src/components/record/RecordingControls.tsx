
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle, Trash2, Music } from "lucide-react";

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
  isLoading = false
}: RecordingControlsProps) => {
  return (
    <div className="flex justify-center items-center gap-4 my-4">
      {!isRecording && !audioUrl && (
        <Button
          onClick={onStart}
          className="bg-palatinate-blue hover:bg-palatinate-blue/90 active:bg-palatinate-blue/80 text-white rounded-full px-8 py-6 h-auto"
          disabled={isLoading}
        >
          <Play className="h-6 w-6" />
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
            <Play className="h-6 w-6" />
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
      
      {audioUrl && !isRecording && showDeleteButton && (
        <Button
          onClick={onDelete}
          variant="destructive"
          className="rounded-full p-3 h-auto"
          disabled={isLoading}
        >
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Delete Recording</span>
        </Button>
      )}

      {audioUrl && !isRecording && showPlayButton && (
        <Button
          className="bg-palatinate-blue hover:bg-palatinate-blue/90 text-white rounded-full px-6 py-4 h-auto"
          onClick={() => {
            const audio = new Audio(audioUrl);
            audio.play();
          }}
          disabled={isLoading}
        >
          <Music className="h-5 w-5 mr-2" />
          <span>Play</span>
        </Button>
      )}
    </div>
  );
};
