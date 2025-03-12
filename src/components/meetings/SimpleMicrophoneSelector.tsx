
import React, { useState, useEffect } from "react";
import { ChevronDown, Mic, AlertCircle } from "lucide-react";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface SimpleMicrophoneSelectorProps {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
}

export function SimpleMicrophoneSelector({
  devices,
  selectedDeviceId,
  onDeviceSelect,
  disabled = false
}: SimpleMicrophoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Log device information on every render for debugging
  useEffect(() => {
    console.log('[SimpleMicrophoneSelector] Received devices:', {
      deviceCount: devices.length,
      deviceDetails: devices.map(d => ({ id: d.deviceId, label: d.label })),
      selectedDeviceId
    });
  }, [devices, selectedDeviceId]);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (deviceId: string) => {
    console.log('[SimpleMicrophoneSelector] Selecting device:', deviceId);
    onDeviceSelect(deviceId);
    setIsOpen(false);
  };

  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className="w-full relative">
      <div className="text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
        <span>Select Microphone</span>
        <span className="text-xs text-blue-600">{devices.length} found</span>
      </div>
      
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className="flex items-center justify-between w-full p-3 bg-white border border-gray-300 rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        {selectedDevice ? (
          <span className="truncate flex items-center">
            <Mic className="h-4 w-4 mr-2 text-blue-500" />
            {selectedDevice.label || `Microphone ${devices.indexOf(selectedDevice) + 1}`}
          </span>
        ) : devices.length > 0 ? (
          <span className="truncate text-amber-600">Please select a microphone</span>
        ) : (
          <span className="truncate flex items-center text-gray-500">
            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
            No microphones found
          </span>
        )}
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {devices.length === 0 ? (
            <div className="p-3 text-amber-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              No microphones found
            </div>
          ) : (
            devices.map((device, index) => (
              <button
                key={device.deviceId}
                type="button"
                className={`w-full text-left p-3 hover:bg-gray-100 ${
                  device.deviceId === selectedDeviceId ? 'bg-blue-50 text-blue-600 font-medium' : ''
                } flex items-center`}
                onClick={() => handleSelect(device.deviceId)}
              >
                <Mic className={`h-4 w-4 mr-2 ${device.deviceId === selectedDeviceId ? 'text-blue-500' : 'text-gray-500'}`} />
                {device.label || `Microphone ${index + 1}`}
              </button>
            ))
          )}
        </div>
      )}
      
      {/* Debug information */}
      <div className="mt-1 text-xs text-gray-500">
        Devices: {devices.length} | Selected: {selectedDeviceId ? 'Yes' : 'No'}
      </div>
    </div>
  );
}
