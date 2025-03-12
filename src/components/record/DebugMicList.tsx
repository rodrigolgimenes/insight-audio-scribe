
import React, { useEffect } from "react";
import { useRobustMicrophoneDetection } from "@/hooks/recording/device/useRobustMicrophoneDetection";
import { Mic, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export function DebugMicList() {
  const { 
    devices, 
    isLoading, 
    permissionState, 
    detectDevices, 
    requestMicrophoneAccess 
  } = useRobustMicrophoneDetection();
  
  // Log details on render and when state changes
  useEffect(() => {
    console.log('[DebugMicList] State updated:', {
      deviceCount: devices.length,
      devices: devices.map(d => ({ id: d.deviceId, label: d.label || 'No label' })),
      permissionState,
      isLoading
    });
  }, [devices, permissionState, isLoading]);
  
  // Handle refreshing devices
  const handleRefresh = async () => {
    console.log('[DebugMicList] Refreshing devices');
    
    try {
      const refreshedDevices = await detectDevices(true);
      toast.success(`Refreshed microphone list (found ${refreshedDevices.length})`);
      console.log('[DebugMicList] Refresh result:', {
        deviceCount: refreshedDevices.length,
        devices: refreshedDevices.map(d => ({ id: d.deviceId, label: d.label || 'No label' }))
      });
    } catch (error) {
      console.error('[DebugMicList] Error refreshing devices:', error);
      toast.error("Failed to refresh microphones");
    }
  };
  
  // Handle requesting permission
  const handleRequestPermission = async () => {
    console.log('[DebugMicList] Requesting permission');
    
    try {
      const result = await requestMicrophoneAccess();
      console.log('[DebugMicList] Permission request result:', result);
    } catch (error) {
      console.error('[DebugMicList] Error requesting permission:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">Microphones (Debug)</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="text-sm space-y-2">
        <div><span className="font-medium">Permission:</span> {permissionState}</div>
        <div><span className="font-medium">Loading:</span> {isLoading ? 'Yes' : 'No'}</div>
        <div><span className="font-medium">Devices found:</span> {devices.length}</div>
      </div>
      
      {permissionState !== 'granted' && (
        <button
          onClick={handleRequestPermission}
          disabled={isLoading}
          className="px-3 py-2 w-full bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {isLoading ? 'Requesting...' : 'Request Microphone Permission'}
        </button>
      )}
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {devices.length > 0 ? (
          devices.map((device) => (
            <Card key={device.deviceId} className="border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Mic className="h-4 w-4 mt-0.5 text-blue-500" />
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{device.label || `Microphone ${device.index + 1}`}</div>
                    <div className="text-xs text-gray-500 truncate">{device.deviceId}</div>
                    {device.isDefault && (
                      <div className="text-xs text-green-600">Default device</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-amber-500 text-center py-4">
            {permissionState === 'granted' 
              ? 'No microphones found' 
              : 'Grant microphone permission to see devices'}
          </div>
        )}
      </div>
    </div>
  );
}
