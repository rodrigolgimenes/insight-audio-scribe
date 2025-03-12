
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface DevicePermissionRequestProps {
  onRequestPermission: () => void;
  isRequesting?: boolean;
}

export function DevicePermissionRequest({
  onRequestPermission,
  isRequesting = false
}: DevicePermissionRequestProps) {
  return (
    <div className="flex flex-col items-center p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
      <Mic className="h-10 w-10 text-blue-500" />
      <div className="text-center">
        <h3 className="font-medium text-blue-700">Microphone Access Needed</h3>
        <p className="text-sm text-blue-600 mt-1">
          We need permission to access your microphone for recording.
        </p>
      </div>
      
      <Button
        onClick={onRequestPermission}
        disabled={isRequesting}
        className="bg-blue-500 hover:bg-blue-600 text-white"
      >
        {isRequesting ? "Requesting Access..." : "Allow Microphone Access"}
      </Button>
      
      <p className="text-xs text-blue-600 text-center">
        When prompted by your browser, please click "Allow" to continue.
      </p>
    </div>
  );
}
