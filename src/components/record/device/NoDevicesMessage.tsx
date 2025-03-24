
import React, { useState, useEffect } from "react";
import { Mic, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoDevicesMessageProps {
  showWarning: boolean;
  onRefresh?: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  audioDevices?: Array<any>; // For debugging purposes
  isLoading?: boolean; // New prop to check if devices are still loading
}

export function NoDevicesMessage({ 
  showWarning,
  onRefresh,
  permissionState = 'unknown',
  audioDevices = [],
  isLoading = false
}: NoDevicesMessageProps) {
  // State to delay showing the warning during initial load
  const [shouldShowWarning, setShouldShowWarning] = useState(false);
  
  // Enhanced check for routes where we should hide the warnings
  const isRestrictedRoute = React.useMemo((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/') ||
           path.includes('simple-record') || // Add simple-record to restricted routes
           path.includes('record');
  }, []);

  // Delay showing warnings to avoid flashing during loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (showWarning && !isLoading && audioDevices.length === 0) {
      // Only show warning after a delay and if still no devices
      timeoutId = setTimeout(() => {
        setShouldShowWarning(true);
      }, 2000); // 2 second delay
    } else {
      setShouldShowWarning(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showWarning, isLoading, audioDevices.length]);
  
  // Debug log info but don't show UI on restricted routes
  useEffect(() => {
    if (showWarning) {
      console.log('[NoDevicesMessage] Warning display check:', {
        isRestrictedRoute,
        path: window.location.pathname,
        permissionState,
        showWarning,
        audioDevicesCount: audioDevices.length,
        isLoading,
        shouldShowWarning,
        timestamp: new Date().toISOString(),
        willDisplay: !isRestrictedRoute && shouldShowWarning && !isLoading
      });
    }
  }, [showWarning, permissionState, audioDevices, isRestrictedRoute, isLoading, shouldShowWarning]);
  
  // Don't show warning in these cases:
  // 1. On restricted routes
  // 2. If we're not explicitly told to show warning
  // 3. If devices are still loading
  // 4. During initial timeout period
  if (isRestrictedRoute || !showWarning || isLoading || !shouldShowWarning) {
    return null;
  }
  
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
            console.log('[NoDevicesMessage] Manual refresh button clicked with state:', {
              permissionState,
              audioDevicesCount: audioDevices.length
            });
            onRefresh();
          }}
          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
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
