
import React from "react";
import { AlertCircle } from "lucide-react";

interface NoDevicesMessageProps {
  showWarning: boolean;
}

export function NoDevicesMessage({ showWarning }: NoDevicesMessageProps) {
  if (!showWarning) return null;
  
  return (
    <div className="flex items-start gap-1.5 mt-2 text-amber-500">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="text-xs space-y-1">
        <p className="font-medium">No microphones detected</p>
        <ul className="list-disc pl-4 text-amber-600/90 space-y-0.5">
          <li>Check if your microphone is connected properly</li>
          <li>Try unplugging and reconnecting your device</li>
          <li>If using a USB microphone, try a different USB port</li>
          <li>Consider refreshing the page after connecting your device</li>
        </ul>
      </div>
    </div>
  );
}
