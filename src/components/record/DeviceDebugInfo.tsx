
import React from "react";
import { Loader2 } from "lucide-react";

interface DeviceDebugInfoProps {
  deviceCount: number;
  selectedDeviceId: string | null;
  isLoading?: boolean;
  permissionState?: 'prompt'|'granted'|'denied'|'unknown';
}

export function DeviceDebugInfo({ 
  deviceCount, 
  selectedDeviceId,
  isLoading = false,
  permissionState = 'unknown'
}: DeviceDebugInfoProps) {
  return (
    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
      <div className="flex items-center gap-1">
        Devices: {deviceCount} found
        {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
      </div>
      {selectedDeviceId && (
        <div className="truncate max-w-full">
          Selected ID: {selectedDeviceId.substring(0, 10)}...
        </div>
      )}
      {permissionState !== 'unknown' && (
        <div className={`
          ${permissionState === 'granted' ? 'text-green-500' : ''}
          ${permissionState === 'denied' ? 'text-red-500' : ''}
          ${permissionState === 'prompt' ? 'text-amber-500' : ''}
        `}>
          Permission: {permissionState}
        </div>
      )}
    </div>
  );
}
