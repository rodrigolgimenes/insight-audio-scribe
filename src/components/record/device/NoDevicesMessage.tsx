
import React from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoDevicesMessageProps {
  showWarning: boolean;
  onRefresh?: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  audioDevices?: Array<any>;
  isLoading?: boolean;
}

export function NoDevicesMessage({ 
  showWarning,
  onRefresh,
  permissionState = 'unknown',
  audioDevices = [],
  isLoading = false
}: NoDevicesMessageProps) {
  if (!showWarning || isLoading) {
    return null;
  }
  
  return (
    <div className="flex flex-col items-center p-3 bg-amber-50 border border-amber-200 rounded-md mt-2">
      <Mic className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-sm font-medium text-amber-700">No microphones detected</h3>
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 mt-2"
        >
          Check Again
        </Button>
      )}
    </div>
  );
}
