
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
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

  // Clean up on unmount
  const cleanup = () => {
    mountedRef.current = false;
  };

  // Enhanced permission check with multiple retry strategies
  const requestPermission = useCallback(async (showToast = true): Promise<boolean> => {
    if (detectionInProgressRef.current) {
      console.log('[usePermissionRequest] Permission check already in progress, skipping duplicate request');
      return permissionState === 'granted';
    }

    detectionInProgressRef.current = true;
    console.log('[usePermissionRequest] Requesting microphone permission explicitly...');
    
    try {
      setHasAttemptedPermission(true);
      
      // Check if browser is fully compatible
      checkBrowserCompatibility();
      
      // Use our improved checkPermissions method
      const hasPermission = await checkPermissions();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return false;
      }
      
      // Update our permission state based on the result
      setPermissionState(hasPermission ? 'granted' : 'denied');
      detectionInProgressRef.current = false;
      
      if (hasPermission && showToast) {
        toast.success("Microphone access granted", {
          id: "mic-permission-granted",
          duration: 3000
        });
      }
      
      return hasPermission;
    } catch (err) {
      console.error('[usePermissionRequest] Unexpected error during permission request:', err);
      
      if (mountedRef.current) {
        setPermissionState('unknown');
        
        if (showToast) {
          toast.error("Failed to access microphone", {
            description: err instanceof Error ? err.message : "Unknown error",
            id: "mic-access-failed"
          });
        }
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
