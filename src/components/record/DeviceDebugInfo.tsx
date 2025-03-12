
import React from "react";

interface DeviceDebugInfoProps {
  deviceCount: number;
  selectedDeviceId: string | null;
  isLoading?: boolean;
  permissionState?: string;
  showDetails?: boolean;
}

export function DeviceDebugInfo({
  deviceCount,
  selectedDeviceId,
  isLoading = false,
  permissionState = "unknown",
  showDetails = true
}: DeviceDebugInfoProps) {
  if (!showDetails) return null;

  return (
    <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded mt-2 border border-gray-100">
      <div className="grid grid-cols-2 gap-x-2">
        <div>Microphones found:</div>
        <div className={deviceCount > 0 ? "text-green-600" : "text-amber-600"}>
          {isLoading ? "Loading..." : `${deviceCount}`}
        </div>
        
        <div>Selected device:</div>
        <div className={selectedDeviceId ? "text-green-600 truncate" : "text-amber-600"} title={selectedDeviceId || "None"}>
          {selectedDeviceId ? selectedDeviceId.substring(0, 12) + "..." : "None"}
        </div>
        
        <div>Permission:</div>
        <div className={
          permissionState === "granted" 
            ? "text-green-600" 
            : permissionState === "denied" 
              ? "text-red-600" 
              : "text-amber-600"
        }>
          {permissionState}
        </div>
        
        <div>Device ready:</div>
        <div className={
          deviceCount > 0 && selectedDeviceId ? "text-green-600" : "text-amber-600"
        }>
          {deviceCount > 0 && selectedDeviceId ? "Yes" : "No"}
        </div>
      </div>
      
      {isLoading && (
        <div className="mt-1 text-blue-500">Searching for microphones...</div>
      )}
      
      {permissionState === "denied" && (
        <div className="mt-1 text-red-500">
          Access to microphone was denied. Please check your browser settings.
        </div>
      )}
    </div>
  );
}
