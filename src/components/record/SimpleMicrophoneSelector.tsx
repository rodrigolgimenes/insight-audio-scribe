
import React, { useState, useEffect } from "react";
import { ChevronDown, Mic, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { isRestrictedRoute } from "@/utils/route/isRestrictedRoute";

export function SimpleMicrophoneSelector() {
  const { 
    devices, 
    selectedDeviceId,
    setSelectedDeviceId,
    permissionState,
    isLoading,
    refreshDevices
  } = useDeviceManager();
  const [isOpen, setIsOpen] = useState(false);
  
  // Ensure we respect restricted routes
  const isRestricted = isRestrictedRoute();
  
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      console.log('[SimpleMicrophoneSelector] Auto-selecting first device');
      setSelectedDeviceId(devices[0].deviceId);
    }
  }, [devices, selectedDeviceId, setSelectedDeviceId]);
  
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setIsOpen(false);
  };
  
  const handleRefresh = () => {
    console.log('[SimpleMicrophoneSelector] Refreshing devices');
    refreshDevices();
  };
  
  const needsPermission = permissionState === 'prompt' || permissionState === 'denied';
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  // For restricted routes, only show minimal UI without notifications
  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2 text-gray-700">
        <span>Select Microphone</span>
      </div>
      
      {needsPermission && (
        <button
          onClick={refreshDevices}
          disabled={isLoading}
          className="w-full p-3 flex items-center justify-center gap-2 bg-blue-50 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Requesting access...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Allow microphone access
            </>
          )}
        </button>
      )}
      
      {!needsPermission && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isLoading}
            className="flex items-center justify-between w-full p-3 bg-white border border-gray-300 rounded-md text-left text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {isLoading ? (
              <span className="truncate flex items-center text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning for microphones...
              </span>
            ) : selectedDevice ? (
              <span className="truncate flex items-center">
                <Mic className="h-4 w-4 mr-2 text-blue-500" />
                {selectedDevice.label}
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
            <div className="absolute z-10 mt-1 w-full">
              <div className="flex flex-col border border-gray-200 rounded-md shadow-sm max-h-60 overflow-auto bg-white">
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    type="button"
                    className={`w-full text-left p-3 hover:bg-gray-100 ${
                      device.deviceId === selectedDeviceId ? 'bg-blue-50 text-blue-600 font-medium' : ''
                    } flex items-center`}
                    onClick={() => handleDeviceSelect(device.deviceId)}
                  >
                    <Mic className={`h-4 w-4 mr-2 ${device.deviceId === selectedDeviceId ? 'text-blue-500' : 'text-gray-500'}`} />
                    {device.label || `Microphone ${device.index + 1}`}
                  </button>
                ))}
                
                {isLoading ? (
                  <div className="p-3 text-gray-500 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning for microphones...
                  </div>
                ) : devices.length === 0 && (
                  <div className="p-3 text-amber-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    No microphones found
                  </div>
                )}
                
                <button
                  type="button"
                  className="w-full text-left p-3 hover:bg-gray-100 text-blue-600 flex items-center justify-center border-t border-gray-200"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  {isLoading ? (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
