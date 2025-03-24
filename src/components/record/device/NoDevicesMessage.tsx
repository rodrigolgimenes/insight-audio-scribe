
import React from "react";

interface NoDevicesMessageProps {
  showWarning: boolean;
  onRefresh?: () => void;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  audioDevices?: Array<any>; 
  isLoading?: boolean;
}

export function NoDevicesMessage() {
  // This component has been completely disabled to remove all microphone notifications
  return null;
}
