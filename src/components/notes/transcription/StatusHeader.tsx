
import React, { ReactNode } from "react";
import { LongRecordingBadge } from "./LongRecordingBadge";
import { HelpTooltip } from "./HelpTooltip";

interface StatusHeaderProps {
  icon: ReactNode;
  message: string;
  color: string;
  isLongAudio: boolean;
  durationInMinutes?: number;
  status: string;
  progress: number;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  icon,
  message,
  color,
  isLongAudio,
  durationInMinutes,
  status,
  progress
}) => {
  const showLongRecordingBadge = isLongAudio && status !== 'completed' && status !== 'error';
  const showProgress = status !== 'completed' && status !== 'error';
  const displayProgress = Math.round(progress || 0);

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className={`font-medium ${color}`}>{message}</span>
        
        {showLongRecordingBadge && durationInMinutes && (
          <LongRecordingBadge durationInMinutes={durationInMinutes} />
        )}
      </div>
      
      {showProgress && (
        <span className="text-sm text-gray-500">{displayProgress}%</span>
      )}
      
      {status === 'error' && <HelpTooltip />}
    </div>
  );
};
