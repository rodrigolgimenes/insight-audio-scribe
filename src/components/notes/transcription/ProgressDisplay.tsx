
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
  if (!showProgress && (!lastProgressUpdate || status === 'completed' || status === 'error')) {
    return null;
  }
  
  return (
    <>
      {showProgress && (
        <Progress value={progress} className="w-full mt-3" />
      )}
      
      {lastProgressUpdate && status !== 'completed' && status !== 'error' && (
        <div className="mt-2 text-xs text-gray-500">
          Last activity: {new Date(lastProgressUpdate).toLocaleTimeString()}
        </div>
      )}
    </>
  );
};
