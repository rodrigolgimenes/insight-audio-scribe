
import React, { useEffect } from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Card, CardContent } from "@/components/ui/card";

export function DebugMicrophonePanel() {
  const { permissionState, devices, selectedDeviceId } = useDeviceManager();

  // Log state changes para depuração
  useEffect(() => {
    console.log("[DebugMicrophonePanel] State update:", {
      permissionState,
      selectedDeviceId,
      devicesCount: devices.length,
      devicesList: devices.map(d => ({ id: d.deviceId, label: d.label }))
    });
  }, [permissionState, selectedDeviceId, devices]);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Microphones (Debug Panel)</h2>
        <div className="space-y-4">
          <MicrophoneSelector />
          
          <div className="text-xs bg-gray-50 p-3 rounded border border-gray-200 space-y-1">
            <div className="font-medium mb-1">Debug Information:</div>
            <div>Permission State: <span className={`font-medium ${
              permissionState === 'granted' ? 'text-green-600' : 
              permissionState === 'denied' ? 'text-red-600' : 'text-amber-600'
            }`}>{permissionState}</span></div>
            <div>Selected Device ID: <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{selectedDeviceId || "None"}</span></div>
            <div>Device Count: {devices.length}</div>
            <div className="pt-1">
              <div className="font-medium">Available Devices:</div>
              {devices.length > 0 ? (
                <ul className="pl-4 list-disc">
                  {devices.map(device => (
                    <li key={device.deviceId} className="text-xs truncate">
                      {device.label || `Microphone ${device.index + 1}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-amber-500">No devices available</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
