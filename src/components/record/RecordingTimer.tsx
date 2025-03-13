
import React from "react";
import { Clock } from "lucide-react";

interface RecordingTimerProps {
  time: number;
  isRecording: boolean;
  isPaused: boolean;
}

export const RecordingTimer = ({ time, isRecording, isPaused }: RecordingTimerProps) => {
  // Format time as MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full 
        ${isRecording ? (isPaused ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800') : 'bg-gray-100 text-gray-800'}
      `}>
        <Clock className="h-4 w-4" />
        <span className="font-medium">{formatTime(time)}</span>
        {isRecording && (
          <span className="text-xs opacity-80">
            {isPaused ? 'Paused' : 'Recording'}
          </span>
        )}
      </div>
    </div>
  );
};
