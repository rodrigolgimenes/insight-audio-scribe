
import { useState, useRef, useEffect } from "react";

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

  // Log state changes
  useEffect(() => {
    console.log('[useDeviceState] State updated:', {
      selectedDeviceId,
      deviceSelectionReady,
      permissionGranted,
      initAttempted: deviceInitializationAttempted.current,
      lastSelectedDevice: lastSelectedDeviceRef.current
    });
  }, [selectedDeviceId, deviceSelectionReady, permissionGranted]);

  const handleDeviceSelect = (deviceId: string) => {
    // Validate the device ID
    if (!deviceId || deviceId === '') {
      console.warn('[useDeviceState] Attempted to select invalid device ID:', deviceId);
      return;
    }
    
    console.log('[useDeviceState] Setting device ID:', deviceId);
    console.log('[useDeviceState] Previous state:', {
      selectedDeviceId,
      deviceSelectionReady,
      lastSelectedDevice: lastSelectedDeviceRef.current
    });
    
    // Update state
    setSelectedDeviceId(deviceId);
    lastSelectedDeviceRef.current = deviceId;
    setDeviceSelectionReady(true);
    
    console.log('[useDeviceState] Device selected successfully:', deviceId);
    
    // Add timeout to verify state update
    setTimeout(() => {
      console.log('[useDeviceState] State after update (timeout check):', {
        selectedDeviceId,
        lastSelectedDevice: lastSelectedDeviceRef.current
      });
    }, 100);
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
