
import { useEffect, useState } from 'react';

interface RecordTimerProps {
  isRecording: boolean;
  isPaused: boolean;
  onTimeLimit: () => void;
}

export const RecordTimer = ({ isRecording, isPaused, onTimeLimit }: RecordTimerProps) => {
  const [seconds, setSeconds] = useState(0);
  const MAX_DURATION = 60 * 60; // 60 minutes in seconds
  
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev + 1 >= MAX_DURATION) {
            onTimeLimit();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, onTimeLimit]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (seconds / MAX_DURATION) * 100;

  return (
    <div className="text-center">
      <div className="text-4xl font-bold mb-2">{formatTime(seconds)}</div>
      <div className="text-sm text-gray-500 mb-4">Limit: 60:00</div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-[#2563EB] h-2.5 rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};
