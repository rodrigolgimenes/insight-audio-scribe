
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface DevicePermissionRequestProps {
  onRequestPermission: () => void;
  isRequesting?: boolean;
  permissionState?: 'prompt'|'granted'|'denied'|'unknown';
}

export function DevicePermissionRequest({
  onRequestPermission,
  isRequesting = false,
  permissionState = 'prompt'
}: DevicePermissionRequestProps) {
  // Log permission state for debugging
  useEffect(() => {
    console.log('[DevicePermissionRequest] Component rendered with permission state:', {
      permissionState,
      isRequesting,
      timestamp: new Date().toISOString()
    });
    
    // Automatically trigger permission request when component mounts if permission is prompt
    if (permissionState === 'prompt' && !isRequesting) {
      console.log('[DevicePermissionRequest] Auto-triggering permission request');
      // Wait a short time to prevent multiple requests
      const timer = setTimeout(() => {
        onRequestPermission();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [permissionState, isRequesting, onRequestPermission]);

  return (
    <div className="flex flex-col items-center p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
      <Mic className="h-10 w-10 text-blue-500" />
      <div className="text-center">
        <h3 className="font-medium text-blue-700">Microphone Access Needed</h3>
        <p className="text-sm text-blue-600 mt-1">
          We need permission to access your microphone for recording.
        </p>
      </div>
      
      <Button
        onClick={() => {
          console.log('[DevicePermissionRequest] Permission request button clicked');
          onRequestPermission();
        }}
        disabled={isRequesting}
        className="bg-blue-500 hover:bg-blue-600 text-white"
        size="lg"
      >
        {isRequesting ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
            Requesting Access...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Allow Microphone Access
          </>
        )}
      </Button>
      
      <p className="text-xs text-blue-600 text-center">
        When prompted by your browser, please click "Allow" to continue.
        <br />
        <span className="font-semibold mt-1 block">After granting permission, microphones will appear in the dropdown.</span>
      </p>
      
      <div className="mt-1 bg-blue-100 p-2 rounded w-full text-xs text-blue-700">
        <div><strong>Current permission status:</strong> {permissionState}</div>
        <div><strong>Request state:</strong> {isRequesting ? 'Requesting...' : 'Ready to request'}</div>
      </div>
    </div>
  );
}
