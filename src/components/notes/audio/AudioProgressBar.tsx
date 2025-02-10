
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
      progress,
      isVisible: duration > 0
    });
  }, [currentTime, duration, progress]);

  if (!duration) {
    console.log('AudioProgressBar - Duration not available yet');
    return null;
  }

  return (
    <div className="flex flex-col w-full gap-2 py-2">
      <div className="relative w-full h-2">
        <div className="absolute w-full h-2 bg-gray-200 rounded-full">
          <div 
            className="absolute h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <Slider
          value={[progress]}
          onValueChange={onProgressChange}
          max={100}
          step={0.1}
          className="absolute inset-0"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
};
