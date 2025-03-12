
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, RefreshCw } from "lucide-react";

interface DevicePermissionRequestProps {
  onRequestPermission: () => Promise<void>;
  isRequesting: boolean;
}

export function DevicePermissionRequest({
  onRequestPermission,
  isRequesting
}: DevicePermissionRequestProps) {
  return (
    <Button 
      onClick={onRequestPermission}
      className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
      disabled={isRequesting}
    >
      <Mic className="h-4 w-4" />
      {isRequesting ? 'Requesting access...' : 'Allow microphone access'}
      {isRequesting && <RefreshCw className="h-4 w-4 animate-spin" />}
    </Button>
  );
}
