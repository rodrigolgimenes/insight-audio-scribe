
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/utils/formatDuration";

interface AudioProgressBarProps {
  currentTime: number;
  duration: number;
  onProgressChange: (value: number[]) => void;
}

export const AudioProgressBar = ({ currentTime, duration, onProgressChange }: AudioProgressBarProps) => {
  const progress = (duration > 0 && isFinite(duration)) ? (currentTime / duration) * 100 : 0;

  console.log('AudioProgressBar render:', {
    currentTime,
    duration: isFinite(duration) ? duration : 'Loading...',
    progress,
    isVisible: duration > 0 && isFinite(duration)
  });

  if (!duration || !isFinite(duration)) {
    console.log('AudioProgressBar - Duration not available yet or invalid');
    return (
      <div className="flex flex-col w-full gap-2">
        <div className="relative w-full h-4">
          <div className="absolute w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute h-full bg-gray-300 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Loading...</span>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="relative w-full h-4">
        <div className="absolute w-full h-4 bg-gray-200 rounded-full overflow-hidden">
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
