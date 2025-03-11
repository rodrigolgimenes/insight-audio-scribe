
import React from "react";

interface LongRecordingNoticeProps {
  durationInMinutes: number | undefined;
}

export const LongRecordingNotice: React.FC<LongRecordingNoticeProps> = ({ durationInMinutes }) => {
  if (!durationInMinutes) return null;
  
  const isExtremelyLong = durationInMinutes > 90;
  
  return (
    <div className="mt-2 text-amber-600 text-sm">
      <p>This is a very long recording ({durationInMinutes} minutes). Processing may take additional time.</p>
      {isExtremelyLong && (
        <p className="mt-1">For recordings over 90 minutes, consider splitting into smaller segments for faster processing.</p>
      )}
    </div>
  );
};
