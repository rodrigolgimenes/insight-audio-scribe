
import React, { useState, useEffect } from "react";
import { Mic, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isRestrictedRoute } from "@/utils/route/isRestrictedRoute";

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
  const [shouldShowWarning, setShouldShowWarning] = useState(false);
  
  // Check if we should show warnings on this route
  const isRestricted = isRestrictedRoute();
  
  // Only show warning after a delay and if not on restricted route
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (showWarning && !isLoading && audioDevices.length === 0 && !isRestricted) {
      timeoutId = setTimeout(() => {
        console.log('[NoDevicesMessage] Setting shouldShowWarning to true');
        setShouldShowWarning(true);
      }, 5000);
    } else {
      setShouldShowWarning(false);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showWarning, isLoading, audioDevices.length, isRestricted]);
  
  // Never show warning on restricted routes
  if (isRestricted || !showWarning || isLoading || !shouldShowWarning) {
    return null;
  }
  
  return (
    <div className="flex flex-col items-center p-3 bg-amber-50 border border-amber-200 rounded-md mt-2">
      <Mic className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-sm font-medium text-amber-700">No microphones detected</h3>
      <p className="text-xs text-amber-600 text-center mt-1 mb-3">
        {permissionState === 'granted' ? 
          'Please check your microphone connection and try again' :
          'Please allow microphone access to continue'}
      </p>
      
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            onRefresh();
            setShouldShowWarning(false);
          }}
          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Scan for Microphones
        </Button>
      )}
    </div>
  );
}
