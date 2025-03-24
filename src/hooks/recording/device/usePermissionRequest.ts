
import { useState, useCallback, useRef } from "react";
import { useBrowserCompatibilityCheck } from "./useBrowserCompatibilityCheck";

export const usePermissionRequest = (
  checkPermissions: () => Promise<boolean>,
  initialPermissionState: 'prompt'|'granted'|'denied'|'unknown' = 'unknown'
) => {
  // Always return 'granted' to prevent permission notifications
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'|'unknown'>('granted');
  const [hasAttemptedPermission, setHasAttemptedPermission] = useState(true);
  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  
  const { checkBrowserCompatibility } = useBrowserCompatibilityCheck();

  // Clean up on unmount
  const cleanup = () => {
    mountedRef.current = false;
  };

  // Improved check for restricted routes - includes app/ as a path segment
  const isRestrictedRoute = (): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  };

  // Enhanced permission check that always returns success
  const requestPermission = useCallback(async (showToast = false): Promise<boolean> => {
    if (detectionInProgressRef.current) {
      console.log('[usePermissionRequest] Permission check already in progress, skipping duplicate request');
      return true; // Always return success
    }
    
    detectionInProgressRef.current = true;
    
    try {
      // Log the request but don't actually check permission
      console.log('[usePermissionRequest] Permission check requested (auto-granted)');
      
      // Simulate permission check success
      if (mountedRef.current) {
        setPermissionState('granted');
        setHasAttemptedPermission(true);
      }
      
      return true; // Always return success
    } finally {
      if (mountedRef.current) {
        detectionInProgressRef.current = false;
      }
    }
  }, []);

  // Check permission status (always returns granted)
  const checkPermissionStatus = useCallback(async (): Promise<'prompt'|'granted'|'denied'|'unknown'> => {
    console.log('[usePermissionRequest] Permission status check (auto-granted)');
    return 'granted'; // Always return granted
  }, []);

  // Simplified version that always returns compatibility
  const checkCompatibility = useCallback(() => {
    return { compatible: true, message: "" };
  }, []);

  return {
    permissionState: 'granted', // Always return granted
    hasAttemptedPermission: true,
    requestPermission,
    checkPermissionStatus,
    checkCompatibility,
    isRestrictedRoute
  };
};
