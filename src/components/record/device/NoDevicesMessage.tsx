
import React from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeviceContext } from "@/providers/DeviceManagerProvider";

interface NoDevicesMessageProps {
  className?: string;
}

export function NoDevicesMessage({ className = "" }: NoDevicesMessageProps) {
  const { devices, isLoading, permissionState, refreshDevices } = useDeviceContext();
  
  if (permissionState === 'granted' || isLoading || devices.length > 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-col items-center p-3 bg-amber-50 border border-amber-200 rounded-md mt-2 ${className}`}>
      <Mic className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-sm font-medium text-amber-700">No microphones detected</h3>
      <p className="text-xs text-amber-600 mb-2">Please connect a microphone and try again</p>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => refreshDevices(true)}
        className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 mt-2"
      >
        Check Again
      </Button>
    </div>
  );
}
