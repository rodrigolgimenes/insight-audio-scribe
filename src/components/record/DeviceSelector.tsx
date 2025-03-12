
import React, { useState, useEffect } from "react";
import { ChevronDown, Mic, AlertCircle, RefreshCw } from "lucide-react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

interface DeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  isReady?: boolean;
  onRefreshDevices?: () => void;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function DeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  disabled = false,
  isReady = false,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown'
}: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Log device information on every render for debugging
  useEffect(() => {
    console.log('[DeviceSelector RENDER]', {
      deviceCount: audioDevices.length,
      deviceDetails: audioDevices.map(d => ({ id: d.deviceId, label: d.label || 'No label' })),
      selectedDeviceId,
      isReady,
      permissionState,
      devicesLoading,
      timestamp: new Date().toISOString()
    });
  }, [audioDevices, selectedDeviceId, isReady, permissionState, devicesLoading]);
  
  // Auto-select first device if permission is granted and we have devices
  useEffect(() => {
    if (permissionState === 'granted' && audioDevices.length > 0 && !selectedDeviceId && !disabled) {
      console.log('[DeviceSelector] Auto-selecting first device:', audioDevices[0].deviceId);
      onDeviceSelect(audioDevices[0].deviceId);
    }
  }, [audioDevices, selectedDeviceId, permissionState, disabled, onDeviceSelect]);

  const toggleDropdown = () => {
    if (!disabled && !devicesLoading) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (deviceId: string) => {
    console.log('[DeviceSelector] Selecting device:', deviceId);
    onDeviceSelect(deviceId);
    setIsOpen(false);
    
    // Show success toast when a device is selected
    const device = audioDevices.find(d => d.deviceId === deviceId);
    toast.success(`Selected: ${device?.label || 'Microphone'}`, {
      duration: 2000
    });
  };
  
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown toggle
    
    if (!onRefreshDevices || devicesLoading) return;
    
    console.log('[DeviceSelector] Refreshing devices');
    
    try {
      await onRefreshDevices();
      toast.success("Refreshed microphone list");
    } catch (error) {
      console.error('[DeviceSelector] Error refreshing devices:', error);
      toast.error("Failed to refresh microphones");
    }
  };

  const selectedDevice = audioDevices.find(device => device.deviceId === selectedDeviceId);
  
  // Determine if we need to request permissions
  const needsPermission = permissionState === 'prompt' || permissionState === 'denied';
  
  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
        <span>Select Microphone</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600">{audioDevices.length} found</span>
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
      
      {/* Microphone Selector Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled || devicesLoading}
          className={`flex items-center justify-between w-full p-3 bg-white border ${isOpen ? 'border-blue-300 ring-2 ring-blue-500' : 'border-gray-300'} rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {selectedDevice ? (
            <span className="truncate flex items-center">
              <Mic className="h-4 w-4 mr-2 text-blue-500" />
              {selectedDevice.label || `Microphone ${audioDevices.indexOf(selectedDevice) + 1}`}
            </span>
          ) : audioDevices.length > 0 ? (
            <span className="truncate text-amber-600">Select a microphone</span>
          ) : needsPermission ? (
            <span className="truncate flex items-center text-amber-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              Allow microphone access
            </span>
          ) : (
            <span className="truncate flex items-center text-gray-500">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              No microphones found
            </span>
          )}
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Device List Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {audioDevices.length === 0 ? (
              <div className="p-3 text-amber-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                No microphones found
              </div>
            ) : (
              <>
                {audioDevices.map((device, index) => (
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
                      {device.isDefault && (
                        <span className="text-xs text-green-600">Default device</span>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
            
            {/* Refresh option at bottom of list */}
            {onRefreshDevices && (
              <button
                type="button"
                className="w-full text-left p-3 hover:bg-gray-100 text-blue-600 flex items-center justify-center border-t border-gray-200"
                onClick={handleRefresh}
                disabled={devicesLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${devicesLoading ? 'animate-spin' : ''}`} />
                Refresh Microphone List
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Permission state and device info */}
      <div className="mt-1 text-xs text-gray-500 flex justify-between">
        <div>Devices: {audioDevices.length}</div>
        <div className={`${permissionState === 'granted' ? 'text-green-600' : 
                       permissionState === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
          Permission: {permissionState}
        </div>
      </div>
    </div>
  );
}
