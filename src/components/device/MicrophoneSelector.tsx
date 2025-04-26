
import React, { useState, useEffect, useRef } from "react";
import { useDeviceContext } from "@/providers/DeviceManagerProvider";
import { Mic, MicOff, ChevronDown } from "lucide-react";

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
    refreshDevices,
    isLoading
  } = useDeviceContext();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initialCheckDoneRef = useRef(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Ensure we have devices on first render, but only once
  useEffect(() => {
    if (!initialCheckDoneRef.current && (devices.length === 0 || !selectedDeviceId) && permissionState === 'granted' && !isLoading) {
      console.log("[MicrophoneSelector] Initial device check");
      refreshDevices(false);
      initialCheckDoneRef.current = true;
    }
  }, [devices, selectedDeviceId, permissionState, refreshDevices, isLoading]);

  const handleSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setDropdownOpen(false);
  };
  
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className={`w-full ${className}`} ref={dropdownRef}>
      <div className="text-sm font-medium mb-2 text-gray-700">
        <span>Select Microphone</span>
      </div>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={disabled || permissionState === 'denied' || isLoading}
          className={`flex items-center justify-between w-full p-3 bg-white border border-gray-300 rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <span className="truncate flex items-center text-gray-500">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning for microphones...
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
          
          <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>
        
        {dropdownOpen && devices.length > 0 && (
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
              className="w-full text-left p-3 border-t border-gray-200 text-blue-600 hover:bg-blue-50 flex items-center"
              onClick={(e) => { 
                e.preventDefault();
                refreshDevices(true);
                setDropdownOpen(false);
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.84 1 6.54 2.71L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  Refresh Devices
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {permissionState === 'denied' && (
        <div className="mt-2 text-xs text-red-500">
          Microphone access denied. Please allow access in your browser settings.
        </div>
      )}
      
      {permissionState === 'prompt' && devices.length === 0 && (
        <button
          onClick={() => refreshDevices(true)}
          className="mt-2 text-xs text-blue-500 hover:underline flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.84 1 6.54 2.71L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          )}
          Click to grant microphone access
        </button>
      )}
    </div>
  );
}
