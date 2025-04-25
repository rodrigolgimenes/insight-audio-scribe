
import React from "react";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Mic, MicOff } from "lucide-react";

interface MicrophoneSelectorProps {
  disabled?: boolean;
  className?: string;
}

export function MicrophoneSelector({ 
  disabled = false,
  className = "" 
}: MicrophoneSelectorProps) {
  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    permissionState
  } = useDeviceManager();
  
  const handleSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };
  
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className={`w-full ${className}`}>
      <div className="text-sm font-medium mb-2 text-gray-700">
        <span>Select Microphone</span>
      </div>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setSelectedDeviceId(selectedDeviceId || devices[0]?.deviceId)}
          disabled={disabled || permissionState === 'denied'}
          className={`flex items-center justify-between w-full p-3 bg-white border border-gray-300 rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {selectedDevice ? (
            <span className="truncate flex items-center">
              <Mic className="h-4 w-4 mr-2 text-blue-500" />
              {selectedDevice.label}
            </span>
          ) : (
            <span className="truncate flex items-center text-gray-500">
              <MicOff className="h-4 w-4 mr-2" />
              No microphone selected
            </span>
          )}
        </button>
        
        {devices.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {devices.map((device) => (
              <button
                key={device.deviceId}
                type="button"
                className={`w-full text-left p-3 hover:bg-gray-100 ${
                  device.deviceId === selectedDeviceId ? 'bg-blue-50 text-blue-600 font-medium' : ''
                } flex items-center`}
                onClick={() => handleSelect(device.deviceId)}
              >
                <Mic className={`h-4 w-4 mr-2 ${device.deviceId === selectedDeviceId ? 'text-blue-500' : 'text-gray-500'}`} />
                {device.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
