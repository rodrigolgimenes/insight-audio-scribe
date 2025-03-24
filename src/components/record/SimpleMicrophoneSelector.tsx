
import React, { useState, useEffect } from "react";
import { useRobustMicrophoneDetection } from "@/hooks/recording/device/useRobustMicrophoneDetection";
import { ChevronDown, Mic, RefreshCw, Loader2 } from "lucide-react";

export function SimpleMicrophoneSelector() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { 
    devices, 
    isLoading, 
    detectDevices, 
    requestMicrophoneAccess 
  } = useRobustMicrophoneDetection();
  const [isOpen, setIsOpen] = useState(false);
  
  // Log details on render and when state changes
  useEffect(() => {
    console.log('[SimpleMicrophoneSelector] State updated:', {
      deviceCount: devices.length,
      devices: devices.map(d => ({ id: d.deviceId, label: d.label || 'No label' })),
      selectedDeviceId,
      isLoading
    });
  }, [devices, selectedDeviceId, isLoading]);
  
  // Auto-select first device when devices load
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      console.log('[SimpleMicrophoneSelector] Auto-selecting first device');
      setSelectedDeviceId(devices[0].deviceId);
    }
  }, [devices, selectedDeviceId]);
  
  // Handle device selection
  const handleDeviceSelect = (deviceId: string) => {
    console.log('[SimpleMicrophoneSelector] Selected device:', deviceId);
    setSelectedDeviceId(deviceId);
    setIsOpen(false);
  };
  
  // Handle refreshing devices
  const handleRefresh = async () => {
    console.log('[SimpleMicrophoneSelector] Refreshing devices');
    try {
      await detectDevices(true);
    } catch (error) {
      console.error('[SimpleMicrophoneSelector] Error refreshing devices:', error);
    }
  };
  
  // Handle requesting permission
  const handleRequestPermission = async () => {
    console.log('[SimpleMicrophoneSelector] Requesting permission');
    try {
      await requestMicrophoneAccess();
    } catch (error) {
      console.error('[SimpleMicrophoneSelector] Error requesting permission:', error);
    }
  };
  
  // Find selected device in list
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);
  
  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-2 text-gray-700 flex items-center justify-between">
        <span>Select Microphone</span>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-xs text-blue-600 flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Scanning...
            </span>
          ) : (
            <span className="text-xs text-blue-600">{devices.length} found</span>
          )}
        </div>
      </div>
      
      {/* Microphone Selector Dropdown */}
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
            <span className="truncate">Select a microphone</span>
          ) : (
            <span className="truncate flex items-center text-gray-500">
              <Mic className="h-4 w-4 mr-2" />
              Select microphone
            </span>
          )}
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Device List */}
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
                <div className="p-3 flex items-center">
                  <Mic className="h-4 w-4 mr-2" />
                  Select microphone
                </div>
              )}
              
              {/* Refresh button */}
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
    </div>
  );
}
