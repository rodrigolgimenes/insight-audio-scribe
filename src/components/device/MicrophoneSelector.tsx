
import React, { useState, useEffect } from "react";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Mic, RefreshCw, ChevronDown, MicOff, Loader2 } from "lucide-react";

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
    permissionState,
    isLoading,
    refreshDevices
  } = useDeviceManager();
  
  const [isOpen, setIsOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mountTime] = useState(Date.now());
  
  useEffect(() => {
    const minLoadingTime = 1000;
    const timeElapsed = Date.now() - mountTime;
    
    if (timeElapsed < minLoadingTime) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, minLoadingTime - timeElapsed);
      
      return () => clearTimeout(timer);
    } else {
      setInitialLoading(false);
    }
  }, [mountTime]);
  
  const toggleDropdown = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setIsOpen(false);
  };
  
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setInitialLoading(true);
    await refreshDevices();
    setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
  };
  
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);
  const effectiveLoading = isLoading || initialLoading;

  return (
    <div className={`w-full ${className}`}>
      <div className="text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
        <span>Select Microphone</span>
        <button 
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1 rounded-full hover:bg-blue-100 text-blue-600"
          title="Refresh microphone list"
        >
          <RefreshCw className={`h-3 w-3 ${effectiveLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="relative">
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled || effectiveLoading}
          className={`flex items-center justify-between w-full p-3 bg-white border ${
            isOpen ? 'border-blue-300 ring-2 ring-blue-500' : 'border-gray-300'
          } rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {effectiveLoading ? (
            <span className="truncate flex items-center text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </span>
          ) : selectedDevice ? (
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
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
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
            
            <button
              type="button"
              className="w-full text-left p-3 hover:bg-gray-100 text-blue-600 flex items-center justify-center border-t border-gray-200"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {effectiveLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
