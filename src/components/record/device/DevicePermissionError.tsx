
import React from "react";
import { AlertTriangle } from "lucide-react";

export function DevicePermissionError() {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md mt-2">
      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
      <div>
        <h3 className="text-sm font-medium text-red-700">Microphone Access Denied</h3>
        <p className="text-xs text-red-600 mt-1">
          You've denied microphone access. To use recording features, you'll need to:
        </p>
        <ol className="list-decimal ml-4 text-xs text-red-600 mt-1">
          <li>Click the camera/microphone icon in your browser's address bar</li>
          <li>Change the microphone permission to "Allow"</li>
          <li>Refresh this page to apply the changes</li>
        </ol>
      </div>
    </div>
  );
}
