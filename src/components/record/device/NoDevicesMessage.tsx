
import React from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeviceContext } from "@/providers/DeviceManagerProvider";

interface NoDevicesMessageProps {
  onRefresh?: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  audioDevices?: Array<any>;
  isLoading?: boolean;
}

export function NoDevicesMessage({
  onRefresh,
  permissionState = 'unknown',
  audioDevices = [],
  isLoading = false
}: NoDevicesMessageProps) {
  // Get values from context or use props as fallback
  const deviceContext = useDeviceContext();
  
  // Use context values if available, otherwise use props
  const actualPermissionState = deviceContext?.permissionState || permissionState;
  const actualDevices = deviceContext?.devices || audioDevices;
  const actualIsLoading = deviceContext?.isLoading || isLoading;
  const actualRefresh = deviceContext?.refreshDevices || onRefresh;
  
  // Don't show the warning if we're loading or if devices are found
  // Also hide the warning if permission is granted and we have devices
  if (actualIsLoading || (actualDevices && actualDevices.length > 0)) {
    return null;
  }
  
  // Handle refresh action
  const handleRefresh = () => {
    if (actualRefresh && typeof actualRefresh === 'function') {
      actualRefresh(true);
    }
  };
  
  return (
    <div className="flex flex-col items-center p-3 bg-amber-50 border border-amber-200 rounded-md mt-2">
      <Mic className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-sm font-medium text-amber-700">No microphones detected</h3>
      {actualRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 mt-2"
        >
          Check Again
        </Button>
      )}
    </div>
  );
}
