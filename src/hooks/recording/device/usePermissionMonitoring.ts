
import { useEffect, useRef } from "react";

export const usePermissionMonitoring = (
  detectDevices: (forceRefresh: boolean) => Promise<any>,
  setPermissionState: (state: 'prompt' | 'granted' | 'denied' | 'unknown') => void
) => {
  const mountedRef = useRef(true);
  const permissionCheckedRef = useRef(false);

  useEffect(() => {
    // Mark component as mounted
    mountedRef.current = true;
    
    // Single initial permission check function
    const checkInitialPermissions = async () => {
      // Avoid redundant checks
      if (permissionCheckedRef.current || !mountedRef.current) return;
      permissionCheckedRef.current = true;
      
      if (!navigator.permissions) {
        console.log('[usePermissionMonitoring] Permissions API not available');
        return;
      }
      
      try {
        console.log('[usePermissionMonitoring] Checking initial permissions');
        const permissionStatus = await navigator.permissions.query({ 
          name: 'microphone' as PermissionName 
        });
        
        if (!mountedRef.current) return;
        
        console.log('[usePermissionMonitoring] Initial permission state:', permissionStatus.state);
        setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
        
        // Only detect devices if permission is granted
        if (permissionStatus.state === 'granted') {
          console.log('[usePermissionMonitoring] Permission granted, detecting devices');
          await detectDevices(true);
        }
        
        // Listen for permission changes
        permissionStatus.addEventListener('change', () => {
          if (!mountedRef.current) return;
          
          console.log('[usePermissionMonitoring] Permission state changed:', permissionStatus.state);
          setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
          
          if (permissionStatus.state === 'granted') {
            console.log('[usePermissionMonitoring] Permission granted, refreshing devices');
            detectDevices(true);
          }
        });
      } catch (err) {
        console.warn('[usePermissionMonitoring] Error checking permissions:', err);
        if (mountedRef.current) {
          setPermissionState('unknown');
        }
      }
    };
    
    // Run the initial check once
    checkInitialPermissions();
    
    // Clean up on unmount
    return () => {
      mountedRef.current = false;
    };
  }, [detectDevices, setPermissionState]);
};
