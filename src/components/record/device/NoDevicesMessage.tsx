
import React from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoDevicesMessageProps {
  showWarning: boolean;
  onRefresh?: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function NoDevicesMessage({ 
  showWarning,
  onRefresh,
  permissionState = 'unknown'
}: NoDevicesMessageProps) {
  // Log when this component shows a warning
  React.useEffect(() => {
    if (showWarning) {
      console.log('[NoDevicesMessage] Showing no devices warning with permission state:', {
        permissionState,
        timestamp: new Date().toISOString()
      });
    }
  }, [showWarning, permissionState]);
  
  if (!showWarning) return null;
  
  // If permission is granted but no devices, suggest reconnection
  const permissionGranted = permissionState === 'granted';
  
  return (
    <div className="flex flex-col items-center p-3 bg-amber-50 border border-amber-200 rounded-md mt-2">
      <Mic className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-sm font-medium text-amber-700">No microphones detected</h3>
      <p className="text-xs text-amber-600 text-center mt-1 mb-3">
        This could be because:
        <ul className="list-disc pl-5 mt-1 text-left">
          <li>No microphone is connected</li>
          <li>Your microphone isn't recognized by the browser</li>
          <li>Your browser needs to be refreshed</li>
          {permissionGranted && <li>Your microphone was disconnected</li>}
        </ul>
      </p>
      
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            console.log('[NoDevicesMessage] Scan button clicked with permission state:', permissionState);
            onRefresh();
          }}
          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          <Mic className="w-4 h-4 mr-2" />
          Scan for Microphones
        </Button>
      )}
      
      <div className="mt-3 text-xs text-amber-600 pt-2 border-t border-amber-200 w-full text-center">
        <div>Permission state: <span className="font-semibold">{permissionState}</span></div>
        <div className="mt-1">
          {permissionGranted 
            ? "Permission is granted but no microphones were found. Try refreshing or reconnecting your device." 
            : "If you've already granted permission but no microphones appear, try refreshing the page"}
        </div>
      </div>
    </div>
  );
}
