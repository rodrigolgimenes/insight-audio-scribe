
import { useState, useEffect, useRef } from "react";

interface UseTimerProps {
  isRecording: boolean;
  isPaused: boolean;
  initialTime?: number;
}

export const useTimer = ({ 
  isRecording, 
  isPaused, 
  initialTime = 0 
}: UseTimerProps) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);

  // Start/stop/pause/resume based on props
  useEffect(() => {
    // If recording started
    if (isRecording && !isPaused && !isRunning) {
      startTimeRef.current = Date.now() - (pausedAtRef.current * 1000);
      setIsRunning(true);
    }
    // If recording paused
    else if (isRecording && isPaused && isRunning) {
      pausedAtRef.current = time;
      setIsRunning(false);
    }
    // If recording resumed
    else if (isRecording && !isPaused && isRunning && !intervalRef.current) {
      startTimeRef.current = Date.now() - (pausedAtRef.current * 1000);
    }
    // If recording stopped
    else if (!isRecording && isRunning) {
      pausedAtRef.current = 0;
      setIsRunning(false);
    }
  }, [isRecording, isPaused, isRunning, time]);

  // Manage timer interval
  useEffect(() => {
    if (isRunning) {
      // Clear any existing intervals just in case
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Start interval
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setTime(elapsed);
        }
      }, 100); // Update 10 times per second for smooth display
    } else if (intervalRef.current) {
      // Clear interval when not running
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Reset timer
  const resetTimer = () => {
    setTime(0);
    pausedAtRef.current = 0;
    startTimeRef.current = null;
  };

  return {
    time,
    isRunning,
    resetTimer
  };
};
