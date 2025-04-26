
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
    
    // Perform a single initial permissions check
    const checkInitialPermissions = async () => {
      if (permissionCheckedRef.current || !mountedRef.current) return;
      permissionCheckedRef.current = true;
      
      if (navigator.permissions) {
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
      }
    };
    
    // Run the initial check
    checkInitialPermissions();
    
    return () => {
      mountedRef.current = false;
    };
  }, [detectDevices, setPermissionState]);
};
