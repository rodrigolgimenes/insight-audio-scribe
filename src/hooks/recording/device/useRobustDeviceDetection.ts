
import { useEffect, useState, useRef } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { usePermissionRequest } from "./usePermissionRequest";
import { useDeviceDetection } from "./useDeviceDetection";
import { usePermissionMonitoring } from "./usePermissionMonitoring";
import { usePeriodicDeviceCheck } from "./usePeriodicDeviceCheck";

/**
 * Enhanced hook for robust device detection and permission handling
 */
export const useRobustDeviceDetection = (
  getAudioDevices: () => Promise<{devices: AudioDevice[], defaultId: string | null}>,
  checkPermissions: () => Promise<boolean>
) => {
  // Track locally selected device ID
  const [localSelectedDeviceId, setLocalSelectedDeviceId] = useState<string | null>(null);
  // Reference to track if devices have been fetched at least once
  const hasAttemptedFetchRef = useRef(false);
  
  // Handle permission checks and requests
  const {
    permissionState,
    setPermissionState,
    hasAttemptedPermission,
    requestPermission,
    cleanup: cleanupPermissions
  } = usePermissionRequest(checkPermissions);

  // Handle device detection
  const {
    devices,
    isLoading,
    refreshAttempts,
    detectDevices,
    cleanup: cleanupDeviceDetection
  } = useDeviceDetection(getAudioDevices, requestPermission);

  // Monitor permission changes
  usePermissionMonitoring(detectDevices, setPermissionState);

  // Periodic check for reconnected devices
  usePeriodicDeviceCheck(devices.length, detectDevices);
  
  // Log key state changes
  useEffect(() => {
    console.log('[useRobustDeviceDetection] Key state changed:', {
      deviceCount: devices.length,
      permissionState,
      isLoading,
      hasAttemptedPermission,
      hasAttemptedFetch: hasAttemptedFetchRef.current
    });
  }, [devices.length, permissionState, isLoading, hasAttemptedPermission]);

  // Initialize on mount with device detection
  useEffect(() => {
    console.log('[useRobustDeviceDetection] Initializing device detection...');
    
    const init = async () => {
      hasAttemptedFetchRef.current = true;
      await detectDevices();
      
      // Try to auto-select first device if we have devices
      if (devices.length > 0 && !localSelectedDeviceId) {
        const deviceToSelect = devices[0].deviceId;
        console.log('[useRobustDeviceDetection] Auto-selecting first device:', deviceToSelect);
        setLocalSelectedDeviceId(deviceToSelect);
      }
    };
    
    init();
    
    // Clean up on unmount
    return () => {
      cleanupPermissions();
      cleanupDeviceDetection();
    };
  }, [detectDevices, cleanupPermissions, cleanupDeviceDetection]);
  
  // Try to select first device when devices become available
  useEffect(() => {
    if (devices.length > 0 && !localSelectedDeviceId) {
      const deviceToSelect = devices[0].deviceId;
      console.log('[useRobustDeviceDetection] Devices available, auto-selecting:', deviceToSelect);
      setLocalSelectedDeviceId(deviceToSelect);
    }
  }, [devices, localSelectedDeviceId]);

  // Enhanced detectDevices that also ensures selection
  const enhancedDetectDevices = async (forceRefresh = false) => {
    console.log('[useRobustDeviceDetection] Enhanced detect devices called');
    const result = await detectDevices(forceRefresh);
    
    // If we have devices but no selection, select the first one
    if (result.devices.length > 0 && !localSelectedDeviceId) {
      const deviceToSelect = result.devices[0].deviceId;
      console.log('[useRobustDeviceDetection] Auto-selecting device after detection:', deviceToSelect);
      setLocalSelectedDeviceId(deviceToSelect);
    }
    
    return result;
  };

  return {
    devices,
    isLoading,
    permissionState,
    hasAttemptedPermission,
    hasAttemptedFetch: hasAttemptedFetchRef.current,
    refreshAttempts,
    detectDevices: enhancedDetectDevices,
    requestPermission,
    selectedDeviceId: localSelectedDeviceId,
    setSelectedDeviceId: setLocalSelectedDeviceId
  };
};
