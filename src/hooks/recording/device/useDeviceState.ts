
import { useState, useRef } from "react";

/**
 * Hook for managing device selection state
 */
export const useDeviceState = () => {
  // Device selection state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  
  // Refs to track selection state
  const deviceInitializationAttempted = useRef(false);
  const selectionInProgressRef = useRef(false);
  const lastSelectedDeviceRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Permission state
  const permissionCheckedRef = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleDeviceSelect = (deviceId: string) => {
    // Validate the device ID
    if (!deviceId || deviceId === '') {
      console.warn('[useDeviceState] Attempted to select invalid device ID:', deviceId);
      return;
    }
    
    console.log('[useDeviceState] Setting device ID:', deviceId);
    
    setSelectedDeviceId(deviceId);
    lastSelectedDeviceRef.current = deviceId;
    setDeviceSelectionReady(true);
    
    console.log('[useDeviceState] Device selected successfully:', deviceId);
  };

  return {
    // State
    selectedDeviceId,
    deviceSelectionReady,
    permissionGranted,
    
    // Refs
    deviceInitializationAttempted,
    selectionInProgressRef,
    lastSelectedDeviceRef,
    refreshTimeoutRef,
    permissionCheckedRef,
    
    // Actions
    setSelectedDeviceId: handleDeviceSelect,
    setDeviceSelectionReady,
    setPermissionGranted
  };
};
