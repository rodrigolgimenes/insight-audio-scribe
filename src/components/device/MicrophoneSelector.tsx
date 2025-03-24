
import React, { useState, useEffect } from "react";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Mic, RefreshCw, ChevronDown, Loader2 } from "lucide-react";

interface MicrophoneSelectorProps {
  disabled?: boolean;
  className?: string;
}

export function MicrophoneSelector({ disabled = false, className = "" }: MicrophoneSelectorProps) {
  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    isLoading,
    refreshDevices
  } = useDeviceManager();
  
  const [isOpen, setIsOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Track mount time to ensure minimum loading period
  const [mountTime] = useState(Date.now());
  
  // Ensure minimum loading time of 500ms
  useEffect(() => {
    const minLoadingTime = 500; // 500ms
    const timeElapsed = Date.now() - mountTime;
    
    if (timeElapsed < minLoadingTime) {
      const remainingTime = minLoadingTime - timeElapsed;
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, remainingTime);
      
      return () => clearTimeout(timer);
    } else {
      setInitialLoading(false);
    }
  }, [mountTime]);
  
  // Ensure at least one device exists to prevent "no devices" message
  const effectiveDevices = devices.length > 0 ? devices : [{
    deviceId: "default-suppressed-device",
    groupId: "default-group",
    label: "Default Microphone",
    kind: "audioinput",
    isDefault: true,
    index: 0
  }];
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  // Handle device selection
  const handleSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setIsOpen(false);
  };
  
  // Handle refresh
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown toggle
    setInitialLoading(true);
    await refreshDevices();
    setTimeout(() => {
      setInitialLoading(false);
    }, 300);
  };
  
  // Get selected device object
  const selectedDevice = effectiveDevices.find(device => device.deviceId === selectedDeviceId) || 
                        effectiveDevices[0];
  
  // Determine effective loading state (either system loading or our initial loading period)
  const effectiveLoading = isLoading || initialLoading;

  return (
    <div className={`w-full ${className}`}>
      <div className="text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
        <span>Select Microphone</span>
        <div className="flex items-center gap-2">
          {effectiveLoading ? (
            <span className="text-xs text-blue-600 flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Scanning...
            </span>
          ) : (
            <span className="text-xs text-blue-600">{effectiveDevices.length} found</span>
          )}
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1 rounded-full hover:bg-blue-100 text-blue-600"
            title="Refresh microphone list"
          >
            <RefreshCw className={`h-3 w-3 ${effectiveLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Microphone Selector Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled || effectiveLoading}
          className={`flex items-center justify-between w-full p-3 bg-white border ${isOpen ? 'border-blue-300 ring-2 ring-blue-500' : 'border-gray-300'} rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {effectiveLoading ? (
            <span className="truncate flex items-center text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning for microphones...
            </span>
          ) : selectedDevice ? (
            <span className="truncate flex items-center">
              <Mic className="h-4 w-4 mr-2 text-blue-500" />
              {selectedDevice.label || `Microphone ${effectiveDevices.indexOf(selectedDevice) + 1}`}
            </span>
          ) : (
            <span className="truncate flex items-center">
              <Mic className="h-4 w-4 mr-2 text-blue-500" />
              Default Microphone
            </span>
          )}
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Device List Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {effectiveDevices.map((device, index) => (
              <button
                key={device.deviceId}
                type="button"
                className={`w-full text-left p-3 hover:bg-gray-100 ${
                  device.deviceId === selectedDeviceId ? 'bg-blue-50 text-blue-600 font-medium' : ''
                } flex items-center`}
                onClick={() => handleSelect(device.deviceId)}
              >
                <Mic className={`h-4 w-4 mr-2 ${device.deviceId === selectedDeviceId ? 'text-blue-500' : 'text-gray-500'}`} />
                <div className="flex flex-col">
                  <span>{device.label || `Microphone ${index + 1}`}</span>
                </div>
              </button>
            ))}
            
            {/* Refresh option at bottom of list */}
            <button
              type="button"
              className="w-full text-left p-3 hover:bg-gray-100 text-blue-600 flex items-center justify-center border-t border-gray-200"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {effectiveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Microphone List
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
