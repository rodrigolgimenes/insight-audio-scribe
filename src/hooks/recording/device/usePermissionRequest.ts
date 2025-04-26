
import { useState, useCallback, useRef } from "react";

export const usePermissionRequest = (
  checkPermissions: () => Promise<boolean>,
  initialPermissionState: 'prompt'|'granted'|'denied'|'unknown' = 'unknown'
) => {
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'|'unknown'>(initialPermissionState);
  const [hasAttemptedPermission, setHasAttemptedPermission] = useState(false);
  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  // Single, efficient permission request function
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent permission requests
    if (detectionInProgressRef.current) {
      console.log('[usePermissionRequest] Permission check already in progress');
      return permissionState === 'granted';
    }

    // If permission is already granted, no need to request again
    if (permissionState === 'granted') {
      console.log('[usePermissionRequest] Permission already granted');
      return true;
    }

    detectionInProgressRef.current = true;
    console.log('[usePermissionRequest] Requesting microphone permission');
    
    try {
      // Mark that we've attempted to get permission
      setHasAttemptedPermission(true);
      
      // Direct permission check
      const hasPermission = await checkPermissions();
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return false;
      
      // Update permission state based on result
      setPermissionState(hasPermission ? 'granted' : 'denied');
      
      console.log(`[usePermissionRequest] Permission ${hasPermission ? 'granted' : 'denied'}`);
      return hasPermission;
    } catch (err) {
      console.error('[usePermissionRequest] Error during permission request:', err);
      
      if (mountedRef.current) {
        setPermissionState('unknown');
      }
      
      return false;
    } finally {
      detectionInProgressRef.current = false;
    }
  }, [checkPermissions, permissionState]);

  return {
    permissionState,
    setPermissionState,
    hasAttemptedPermission,
    requestPermission,
    cleanup: () => {
      mountedRef.current = false;
    }
  };
};
