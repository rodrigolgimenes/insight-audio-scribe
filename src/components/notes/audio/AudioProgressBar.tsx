
import React, { useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/utils/formatDuration";

interface AudioProgressBarProps {
  currentTime: number;
  duration: number;
  onProgressChange: (value: number[]) => void;
}

export const AudioProgressBar = ({ currentTime, duration, onProgressChange }: AudioProgressBarProps) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    console.log('AudioProgressBar - State Update:', {
      currentTime,
      duration,
      progress
    });
  }, [currentTime, duration, progress]);

  if (duration === 0) {
    console.log('AudioProgressBar - No duration available');
    return null;
  }

  return (
    <div className="w-full space-y-2 min-h-[48px] flex flex-col justify-center bg-gray-50 rounded-lg p-2">
      <div className="relative w-full h-2 bg-gray-200 rounded">
        <div 
          className="absolute left-0 top-0 h-full bg-primary rounded transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <Slider
          value={[progress]}
          onValueChange={onProgressChange}
          max={100}
          step={0.1}
          className="absolute inset-0"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 pt-1">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
};
