
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
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

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (deviceId: string) => {
    onDeviceSelect(deviceId);
    setIsOpen(false);
  };

  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className="w-full relative">
      <div className="text-sm font-medium mb-2 text-gray-700">Select Microphone</div>
      
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className="flex items-center justify-between w-full p-3 bg-white border border-gray-300 rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        <span className="truncate">
          {selectedDevice 
            ? (selectedDevice.label || `Microphone ${devices.indexOf(selectedDevice) + 1}`) 
            : "Select a microphone"}
        </span>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {devices.length === 0 ? (
            <div className="p-3 text-gray-500">No microphones found</div>
          ) : (
            devices.map((device, index) => (
              <button
                key={device.deviceId}
                type="button"
                className={`w-full text-left p-3 hover:bg-gray-100 ${
                  device.deviceId === selectedDeviceId ? 'bg-blue-50 text-blue-600 font-medium' : ''
                }`}
                onClick={() => handleSelect(device.deviceId)}
              >
                {device.label || `Microphone ${index + 1}`}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
