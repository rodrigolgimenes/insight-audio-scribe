
import React from 'react';

interface RecordingTimerProps {
  elapsedTime: number;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = ({ elapsedTime }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center font-mono text-xl">
      {formatTime(elapsedTime)}
    </div>
  );
};
