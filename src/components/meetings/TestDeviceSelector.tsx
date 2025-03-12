
import React from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { ChevronDown } from "lucide-react";

interface TestDeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  isLoading?: boolean;
  label?: string;
}

export function TestDeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isLoading = false,
  label = "Audio Device"
}: TestDeviceSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleDeviceSelect = (deviceId: string) => {
    onDeviceSelect(deviceId);
    setIsOpen(false);
  };

  const selectedDevice = audioDevices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className="space-y-2 w-full">
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      
      <div className="relative">
        {/* Custom dropdown trigger */}
        <button
          type="button"
          onClick={toggleDropdown}
          className="flex items-center justify-between w-full p-3 bg-white border border-gray-300 rounded-md text-left text-gray-700"
          disabled={isLoading}
        >
          <span className="truncate">
            {selectedDevice 
              ? (selectedDevice.label || `Microphone ${audioDevices.indexOf(selectedDevice) + 1}`) 
              : "Select a microphone"}
          </span>
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Dropdown content */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {audioDevices.length === 0 ? (
              <div className="p-3 text-gray-500">No microphones found</div>
            ) : (
              audioDevices.map((device, index) => (
                <button
                  key={device.deviceId}
                  type="button"
                  className={`w-full text-left p-3 hover:bg-gray-100 ${
                    device.deviceId === selectedDeviceId ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                  onClick={() => handleDeviceSelect(device.deviceId)}
                >
                  {device.label || `Microphone ${index + 1}`}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
