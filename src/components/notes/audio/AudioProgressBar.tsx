
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/utils/formatDuration";

interface AudioProgressBarProps {
  currentTime: number;
  duration: number;
  onProgressChange: (value: number[]) => void;
}

export const AudioProgressBar = ({ currentTime, duration, onProgressChange }: AudioProgressBarProps) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-2">
      <Slider
        value={[progress]}
        onValueChange={onProgressChange}
        max={100}
        step={0.1}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-gray-500">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
};
