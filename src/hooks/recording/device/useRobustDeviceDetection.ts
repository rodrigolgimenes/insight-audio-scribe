
import { useEffect } from "react";
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

  // Initialize on mount with device detection
  useEffect(() => {
    console.log('[useRobustDeviceDetection] Initializing device detection...');
    detectDevices();
    
    // Clean up on unmount
    return () => {
      cleanupPermissions();
      cleanupDeviceDetection();
    };
  }, [detectDevices, cleanupPermissions, cleanupDeviceDetection]);

  return {
    devices,
    isLoading,
    permissionState,
    hasAttemptedPermission,
    refreshAttempts,
    detectDevices,
    requestPermission
  };
};
