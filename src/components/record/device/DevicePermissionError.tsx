
import React from "react";
import { AlertTriangle } from "lucide-react";

export function DevicePermissionError() {
  return (
    <div className="text-red-500 text-xs mt-1 flex items-start gap-1">
      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>
        Microphone access denied. Please allow access in your browser settings and refresh the page.
      </span>
    </div>
  );
}
