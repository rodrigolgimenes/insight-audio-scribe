
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause, Save, Trash2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { RecordControls } from "@/components/record/RecordControls";

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
  isLoading?: boolean;
  onSave?: () => Promise<any>;
  isSaving?: boolean;
  processingProgress?: number;
  processingStage?: string;
  disabled?: boolean; // Add disabled prop
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
  onSave,
  isSaving = false,
  processingProgress = 0,
  processingStage = "",
  disabled = false // Add default value
}: RecordingControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle playback
  const handlePlay = () => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.play().catch(err => {
      console.error("Error playing audio:", err);
      setIsPlaying(false);
    });
  };

  // During recording, show record controls
  if (isRecording || !audioUrl) {
    return (
      <RecordControls
        isRecording={isRecording}
        isPaused={isPaused}
        onStartRecording={onStart}
        onStopRecording={onStop}
        onPauseRecording={onPause}
        onResumeRecording={onResume}
        deviceSelectionReady={true}
        disabled={disabled}
      />
    );
  }

  // After recording, show playback and save controls
  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-4">
        {/* Play button */}
        {showPlayButton && (
          <Button
            onClick={handlePlay}
            disabled={isPlaying || isLoading || disabled}
            className={cn(
              "rounded-full w-14 h-14 bg-green-500 hover:bg-green-600",
              isPlaying && "animate-pulse"
            )}
            aria-label="Play Recording"
          >
            <Play className="h-6 w-6 text-white" />
          </Button>
        )}

        {/* Delete button */}
        {showDeleteButton && (
          <Button
            onClick={onDelete}
            variant="outline"
            disabled={isLoading || disabled}
            className="rounded-full w-12 h-12 text-red-500 border-red-200 hover:bg-red-50"
            aria-label="Delete Recording"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}

        {/* Save button */}
        {onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving || isLoading || disabled}
            className={cn(
              "rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600",
              isSaving && "animate-pulse"
            )}
            aria-label="Save Recording"
          >
            {isSaving ? (
              <Spinner className="h-6 w-6 text-white" />
            ) : (
              <Save className="h-6 w-6 text-white" />
            )}
          </Button>
        )}
      </div>

      {/* Processing progress */}
      {isSaving && processingProgress > 0 && (
        <div className="w-full max-w-xs mt-2">
          <Progress value={processingProgress} />
          <p className="text-xs text-center mt-1 text-gray-500">
            {processingStage || "Processing..."}
          </p>
        </div>
      )}
    </div>
  );
};
