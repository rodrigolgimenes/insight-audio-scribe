
import React, { useState } from "react";
import { useRobustMicrophoneDetection } from "@/hooks/recording/device/useRobustMicrophoneDetection";
import { TestDeviceSelector } from "@/components/record/TestDeviceSelector";
import { Mic, RefreshCw } from "lucide-react";

export function DeviceListTester() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { 
    devices, 
    isLoading, 
    permissionState, 
    detectDevices 
  } = useRobustMicrophoneDetection();
  
  // Handle device selection
  const handleDeviceSelect = (deviceId: string) => {
    console.log('[DeviceListTester] Device selected:', deviceId);
    setSelectedDeviceId(deviceId);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    console.log('[DeviceListTester] Refreshing devices...');
    await detectDevices(true);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">Test Device Selector</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="text-sm space-y-1">
        <div className="flex space-x-1">
          <span className="font-medium">Permission:</span> 
          <span className={`${permissionState === 'granted' ? 'text-green-600' : 
            permissionState === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
            {permissionState}
          </span>
        </div>
        <div><span className="font-medium">Loading:</span> {isLoading ? 'Yes' : 'No'}</div>
        <div><span className="font-medium">Selected:</span> {selectedDeviceId || 'None'}</div>
      </div>
      
      <TestDeviceSelector
        audioDevices={devices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={handleDeviceSelect}
        isLoading={isLoading}
        permissionState={permissionState}
      />
      
      <div className="text-xs text-gray-500 mt-2">
        <div className="font-medium mb-1">Available Devices ({devices.length}):</div>
        <div className="space-y-1 pl-2">
          {devices.length > 0 ? (
            devices.map((device) => (
              <div key={device.deviceId} className="flex items-center gap-1">
                <Mic className="h-3 w-3 text-gray-400" />
                <span>{device.label || `Microphone ${device.index + 1}`}</span>
              </div>
            ))
          ) : (
            <div className="text-amber-500">No microphones available</div>
          )}
        </div>
      </div>
    </div>
  );
}
