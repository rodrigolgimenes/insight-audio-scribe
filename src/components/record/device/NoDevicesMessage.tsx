
import React from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeviceContext } from "@/providers/DeviceManagerProvider";

interface NoDevicesMessageProps {
  className?: string;
}

export function NoDevicesMessage({ className = "" }: NoDevicesMessageProps) {
  const { devices, isLoading, permissionState, refreshDevices } = useDeviceContext();
  
  // Only show the warning if permission is not granted, not loading, and no devices found
  if (permissionState === 'granted' || isLoading || devices.length > 0) {
    return null;
  }
  
  // Handle refresh action
  const handleRefresh = () => {
    refreshDevices(true);
  };
  
  return (
    <div className={`flex flex-col items-center p-3 bg-amber-50 border border-amber-200 rounded-md mt-2 ${className}`}>
      <Mic className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-sm font-medium text-amber-700">No microphones detected</h3>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh}
        className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 mt-2"
      >
        Check Again
      </Button>
    </div>
  );
}
