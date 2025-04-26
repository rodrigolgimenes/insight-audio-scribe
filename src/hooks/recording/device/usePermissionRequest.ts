
import { useState, useCallback, useRef } from "react";

export const usePermissionRequest = (
  checkPermissions: () => Promise<boolean>,
  initialPermissionState: 'prompt'|'granted'|'denied'|'unknown' = 'unknown'
) => {
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'|'unknown'>(initialPermissionState);
  const [hasAttemptedPermission, setHasAttemptedPermission] = useState(false);
  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (detectionInProgressRef.current) {
      console.log('[usePermissionRequest] Permission check already in progress');
      return permissionState === 'granted';
    }

    detectionInProgressRef.current = true;
    console.log('[usePermissionRequest] Requesting microphone permission');
    
    try {
      setHasAttemptedPermission(true);
      
      // Single, direct permission check
      const hasPermission = await checkPermissions();
      
      if (!mountedRef.current) return false;
      
      setPermissionState(hasPermission ? 'granted' : 'denied');
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
