
import React from "react";

interface NoDevicesMessageProps {
  showWarning: boolean;
  onRefresh?: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  audioDevices?: Array<any>; 
  isLoading?: boolean;
}

export function NoDevicesMessage() {
  // This component has been disabled to remove microphone notifications
  return null;
}
