
import React, { useState, useEffect } from "react";
import { ChevronDown, Mic, AlertCircle, RefreshCw } from "lucide-react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

interface SimpleMicrophoneSelectorProps {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  onRefreshDevices?: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function SimpleMicrophoneSelector({
  devices,
  selectedDeviceId,
  onDeviceSelect,
  disabled = false,
  onRefreshDevices,
  permissionState = 'unknown'
}: SimpleMicrophoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);
  
  // Log device information on every render for debugging
  console.log('[SimpleMicrophoneSelector RENDER]', {
    deviceCount: devices.length,
    deviceDetails: devices.map(d => ({ id: d.deviceId, label: d.label || 'No label' })),
    selectedDeviceId,
    permissionState,
    timestamp: new Date().toISOString()
  });
  
  useEffect(() => {
    // If permission is granted but no devices, try refreshing
    if (permissionState === 'granted' && devices.length === 0 && onRefreshDevices && !devicesLoading) {
      console.log('[SimpleMicrophoneSelector] Permission granted but no devices, triggering refresh');
      handleRefresh();
    }
    
    // If we have devices but no selection, select the first one
    if (devices.length > 0 && !selectedDeviceId) {
      console.log('[SimpleMicrophoneSelector] Devices available but no selection, selecting first device');
      onDeviceSelect(devices[0].deviceId);
    }
  }, [devices, selectedDeviceId, permissionState, devicesLoading, onRefreshDevices]);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (deviceId: string) => {
    console.log('[SimpleMicrophoneSelector] Selecting device:', deviceId);
    onDeviceSelect(deviceId);
    setIsOpen(false);
    
    // Show selection toast
    const device = devices.find(d => d.deviceId === deviceId);
    toast.success(`Selected: ${device?.label || 'Microphone'}`, {
      duration: 2000
    });
  };
  
  const handleRefresh = async () => {
    if (!onRefreshDevices) return;
    
    console.log('[SimpleMicrophoneSelector] Refreshing devices');
    setDevicesLoading(true);
    
    try {
      await onRefreshDevices();
      toast.success("Refreshed microphone list");
    } catch (error) {
      console.error('[SimpleMicrophoneSelector] Error refreshing devices:', error);
      toast.error("Failed to refresh microphones");
    } finally {
      setDevicesLoading(false);
    }
  };

  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className="w-full relative">
      <div className="text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
        <span>Select Microphone</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600">{devices.length} found</span>
          {onRefreshDevices && (
            <button 
              onClick={handleRefresh}
              disabled={devicesLoading}
              className="p-1 rounded-full hover:bg-blue-100 text-blue-600"
              title="Refresh microphone list"
            >
              <RefreshCw className={`h-3 w-3 ${devicesLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
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
          
          {/* Refresh option at bottom of list */}
          {onRefreshDevices && (
            <button
              type="button"
              className="w-full text-left p-3 hover:bg-gray-100 text-blue-600 flex items-center justify-center border-t border-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={devicesLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${devicesLoading ? 'animate-spin' : ''}`} />
              Refresh Microphone List
            </button>
          )}
        </div>
      )}
      
      {/* Permission state indicator */}
      <div className="mt-1 text-xs text-gray-500 flex justify-between">
        <span>Devices: {devices.length} | Selected: {selectedDeviceId ? 'Yes' : 'No'}</span>
        <span>Permission: {permissionState}</span>
      </div>
    </div>
  );
}
