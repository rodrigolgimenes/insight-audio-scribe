
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
    <div className="w-full space-y-2 min-h-[48px] flex flex-col justify-center">
      <Slider
        value={[progress]}
        onValueChange={onProgressChange}
        max={100}
        step={0.1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
};
