
import { useState, useCallback, useRef } from "react";
import { useBrowserCompatibilityCheck } from "./useBrowserCompatibilityCheck";

export const usePermissionRequest = (
  checkPermissions: () => Promise<boolean>,
  initialPermissionState: 'prompt'|'granted'|'denied'|'unknown' = 'unknown'
) => {
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'|'unknown'>(initialPermissionState);
  const [hasAttemptedPermission, setHasAttemptedPermission] = useState(false);
  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  
  const { checkBrowserCompatibility } = useBrowserCompatibilityCheck();

  const cleanup = () => {
    mountedRef.current = false;
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (detectionInProgressRef.current) {
      console.log('[usePermissionRequest] Permission check already in progress');
      return permissionState === 'granted';
    }

    detectionInProgressRef.current = true;
    console.log('[usePermissionRequest] Requesting microphone permission');
    
    try {
      setHasAttemptedPermission(true);
      checkBrowserCompatibility();
      
      // Single, direct permission check
      const hasPermission = await checkPermissions();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return false;
      }
      
      setPermissionState(hasPermission ? 'granted' : 'denied');
      detectionInProgressRef.current = false;
      return hasPermission;
    } catch (err) {
      console.error('[usePermissionRequest] Error during permission request:', err);
      
      if (mountedRef.current) {
        setPermissionState('unknown');
      }
      
      detectionInProgressRef.current = false;
      return false;
    }
  }, [checkPermissions, permissionState, checkBrowserCompatibility]);

  return {
    permissionState,
    setPermissionState,
    hasAttemptedPermission,
    requestPermission,
    cleanup
  };
};
