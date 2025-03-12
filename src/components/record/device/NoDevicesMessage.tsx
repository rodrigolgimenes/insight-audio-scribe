
import React from "react";

interface NoDevicesMessageProps {
  showWarning: boolean;
}

export function NoDevicesMessage({ showWarning }: NoDevicesMessageProps) {
  if (!showWarning) return null;
  
  return (
    <div className="text-amber-500 text-xs mt-1">
      No microphones detected. Please connect a microphone and refresh.
    </div>
  );
}
