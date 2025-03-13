
import React from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useDeviceManager } from "@/context/DeviceManagerContext";

export function DebugMicrophonePanel() {
  const { devices, selectedDeviceId, permissionState } = useDeviceManager();

  return (
    <div className="p-3 border rounded space-y-2">
      <h3 className="text-sm font-medium">Record Audio</h3>
      <MicrophoneSelector />
      <div className="text-xs text-gray-600">
        <div>Selected Device: {selectedDeviceId || "None"}</div>
        <div>Device Count: {devices.length}</div>
      </div>
    </div>
  );
}
