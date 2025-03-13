
import React, { useState, useEffect } from "react";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Mic, RefreshCw, ChevronDown, AlertCircle, MicOff } from "lucide-react";
import { toast } from "sonner";

interface MicrophoneSelectorProps {
  disabled?: boolean;
  className?: string;
}

export function MicrophoneSelector({ disabled = false, className = "" }: MicrophoneSelectorProps) {
  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    permissionState,
    isLoading,
    refreshDevices
  } = useDeviceManager();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if we're on a restricted route (dashboard, index, app)
  const isRestrictedRoute = React.useMemo(() => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);
  
  // Debug log for selector state on mount and updates
  React.useEffect(() => {
    console.log('[MicrophoneSelector] Component state:', {
      deviceCount: devices.length,
      selectedDeviceId,
      permissionState,
      isLoading,
      isRestrictedRoute: isRestrictedRoute
    });
  }, [devices.length, selectedDeviceId, permissionState, isLoading, isRestrictedRoute]);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  // Handle device selection
  const handleSelect = (deviceId: string) => {
    console.log('[MicrophoneSelector] Selecting device:', deviceId);
    setSelectedDeviceId(deviceId);
    setIsOpen(false);
    
    // Only show toast on non-restricted routes
    if (!isRestrictedRoute) {
      toast.success("Microphone selected", {
        id: "mic-selected"
      });
    }
  };
  
  // Handle refresh
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown toggle
    console.log('[MicrophoneSelector] Refreshing devices');
    await refreshDevices();
  };
  
  // Get selected device object
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);
  const needsPermission = permissionState === 'prompt' || permissionState === 'denied';

  return (
    <div className={`w-full ${className}`}>
      <div className="text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
        <span>Select Microphone</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600">{devices.length} found</span>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1 rounded-full hover:bg-blue-100 text-blue-600"
            title="Refresh microphone list"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Microphone Selector Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled || isLoading}
          className={`flex items-center justify-between w-full p-3 bg-white border ${isOpen ? 'border-blue-300 ring-2 ring-blue-500' : 'border-gray-300'} rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {selectedDevice ? (
            <span className="truncate flex items-center">
              <Mic className="h-4 w-4 mr-2 text-blue-500" />
              {selectedDevice.label || `Microphone ${devices.indexOf(selectedDevice) + 1}`}
            </span>
          ) : devices.length > 0 ? (
            <span className="truncate text-amber-600">Select a microphone</span>
          ) : needsPermission ? (
            <span className="truncate flex items-center text-amber-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              Allow microphone access
            </span>
          ) : (
            <span className="truncate flex items-center text-gray-500">
              <MicOff className="h-4 w-4 mr-2 text-amber-500" />
              No microphones found
            </span>
          )}
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Device List Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {devices.length === 0 ? (
              <div className="p-3 text-amber-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {needsPermission ? 'Allow microphone access' : 'No microphones found'}
              </div>
            ) : (
              <>
                {devices.map((device, index) => (
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
                      {device.groupId && device.groupId === 'default' && (
                        <span className="text-xs text-green-600">Default device</span>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
            
            {/* Refresh option at bottom of list */}
            <button
              type="button"
              className="w-full text-left p-3 hover:bg-gray-100 text-blue-600 flex items-center justify-center border-t border-gray-200"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Microphone List
            </button>
          </div>
        )}
      </div>
      
      {/* Permission state and device info */}
      <div className="mt-1 text-xs text-gray-500 flex justify-between">
        <div>Devices: {devices.length}</div>
        <div className={`${permissionState === 'granted' ? 'text-green-600' : 
                       permissionState === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
          Permission: {permissionState}
        </div>
      </div>
    </div>
  );
}
