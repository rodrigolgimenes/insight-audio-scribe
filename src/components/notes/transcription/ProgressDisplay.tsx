
import React from "react";
import { Progress } from "@/components/ui/progress";

interface ProgressDisplayProps {
  showProgress: boolean;
  progress: number;
  lastProgressUpdate: Date | null;
  status: string;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  showProgress,
  progress,
  lastProgressUpdate,
  status
}) => {
  // Only render when there's something to show: either progress bar or last update time
  if (!showProgress && (!lastProgressUpdate || status === 'completed' || status === 'error')) {
    return null;
  }
  
  return (
    <div className="mt-2">
      {showProgress && (
        <Progress value={progress} className="w-full mt-3 h-2 bg-blue-100" />
      )}
      
      {lastProgressUpdate && status !== 'completed' && status !== 'error' && (
        <div className="mt-2 text-xs text-gray-500">
          Last activity: {lastProgressUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
