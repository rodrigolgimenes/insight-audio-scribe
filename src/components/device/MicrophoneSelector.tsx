import React, { useState, useEffect } from "react";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Mic, RefreshCw, ChevronDown, AlertCircle, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NoDevicesMessage } from "@/components/record/device/NoDevicesMessage";

interface MicrophoneSelectorProps {
  disabled?: boolean;
  className?: string;
  showNoDevicesWarning?: boolean;
}

export function MicrophoneSelector({ 
  disabled = false, 
  className = "",
  showNoDevicesWarning = true
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
  
  const isRestrictedRoute = React.useMemo(() => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/') ||
           path.includes('simple-record') ||
           path.includes('record');
  }, []);
  
  useEffect(() => {
    const minLoadingTime = 3000;
    const timeElapsed = Date.now() - mountTime;
    
    if (timeElapsed < minLoadingTime) {
      const remainingTime = minLoadingTime - timeElapsed;
      const timer = setTimeout(() => {
        setInitialLoading(false);
        console.log('[MicrophoneSelector] Initial loading period completed after:', minLoadingTime, 'ms');
      }, remainingTime);
      
      return () => clearTimeout(timer);
    } else {
      setInitialLoading(false);
    }
  }, [mountTime]);
  
  React.useEffect(() => {
    console.log('[MicrophoneSelector] Component state:', {
      deviceCount: devices.length,
      selectedDeviceId,
      permissionState,
      isLoading,
      initialLoading,
      mountTime,
      timeElapsed: Date.now() - mountTime,
      isRestrictedRoute: isRestrictedRoute
    });
  }, [devices.length, selectedDeviceId, permissionState, isLoading, initialLoading, mountTime, isRestrictedRoute]);
  
  const toggleDropdown = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (deviceId: string) => {
    console.log('[MicrophoneSelector] Selecting device:', deviceId);
    setSelectedDeviceId(deviceId);
    setIsOpen(false);
    
    if (!isRestrictedRoute) {
      toast.success("Microphone selected", {
        id: "mic-selected"
      });
    }
  };
  
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[MicrophoneSelector] Refreshing devices');
    setInitialLoading(true);
    await refreshDevices();
    setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
  };
  
  const handleRefreshForNoDevices = () => {
    console.log('[MicrophoneSelector] Refresh triggered from NoDevicesMessage');
    setInitialLoading(true);
    handleRefresh(new MouseEvent('click') as unknown as React.MouseEvent);
    setTimeout(() => {
      setInitialLoading(false);
    }, 2000);
  };
  
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);
  const needsPermission = permissionState === 'prompt' || permissionState === 'denied';
  
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
            <span className="text-xs text-blue-600">{devices.length} found</span>
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
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {effectiveLoading ? (
              <div className="p-3 text-gray-500 flex items-center justify-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning for microphones...
              </div>
            ) : devices.length === 0 ? (
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
      
      <div className="mt-1 text-xs text-gray-500 flex justify-between">
        <div>{effectiveLoading ? "Scanning..." : `Devices: ${devices.length}`}</div>
        <div className={`${permissionState === 'granted' ? 'text-green-600' : 
                       permissionState === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
          Permission: {permissionState}
        </div>
      </div>
      
      {showNoDevicesWarning && (
        <NoDevicesMessage 
          showWarning={devices.length === 0 && permissionState === 'granted'} 
          onRefresh={handleRefreshForNoDevices}
          permissionState={permissionState}
          audioDevices={devices}
          isLoading={effectiveLoading}
        />
      )}
    </div>
  );
}
