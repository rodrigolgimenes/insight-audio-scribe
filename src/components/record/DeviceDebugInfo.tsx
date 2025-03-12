
import React from "react";

interface DeviceDebugInfoProps {
  deviceCount: number;
  selectedDeviceId: string | null;
}

export function DeviceDebugInfo({ deviceCount, selectedDeviceId }: DeviceDebugInfoProps) {
  return (
    <div className="text-xs text-gray-500 mt-1">
      <div>Devices: {deviceCount} found</div>
      {selectedDeviceId && (
        <div className="truncate max-w-full">
          Selected ID: {selectedDeviceId.substring(0, 10)}...
        </div>
      )}
    </div>
  );
}
