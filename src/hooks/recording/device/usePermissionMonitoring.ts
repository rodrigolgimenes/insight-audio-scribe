
import { useEffect, useRef } from "react";

export const usePermissionMonitoring = (
  detectDevices: (forceRefresh: boolean) => Promise<any>,
  setPermissionState: (state: 'prompt' | 'granted' | 'denied' | 'unknown') => void
) => {
  const initialCheckDoneRef = useRef(false);
  const permissionEventBoundRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Mark component as mounted
    mountedRef.current = true;
    
    // Set up device change monitoring
    const handleDeviceChange = () => {
      if (!mountedRef.current) return;
      
      console.log('[usePermissionMonitoring] Device change detected');
      detectDevices(true);
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // Perform an initial permissions check
    const checkInitialPermissions = async () => {
      if (initialCheckDoneRef.current || !mountedRef.current) return;
      initialCheckDoneRef.current = true;
      
      // First try the Permissions API if available
      if (navigator.permissions) {
        try {
          console.log('[usePermissionMonitoring] Checking permissions using Permissions API');
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          if (!mountedRef.current) return;
          
          // Update initial state
          console.log('[usePermissionMonitoring] Initial permission state:', permissionStatus.state);
          setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
          
          // Set up permission change listener if not already done
          if (!permissionEventBoundRef.current) {
            permissionEventBoundRef.current = true;
            
            permissionStatus.addEventListener('change', () => {
              if (!mountedRef.current) return;
              
              console.log('[usePermissionMonitoring] Permission change detected:', permissionStatus.state);
              setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
              
              // If permission becomes granted, refresh device list
              if (permissionStatus.state === 'granted') {
                console.log('[usePermissionMonitoring] Permission granted, refreshing devices');
                detectDevices(true);
              }
            });
          }
        } catch (err) {
          if (!mountedRef.current) return;
          console.warn('[usePermissionMonitoring] Error checking permissions:', err);
        }
      } else {
        console.log('[usePermissionMonitoring] Permissions API not available');
      }
    };
    
    // Run the initial check without fallbacks
    checkInitialPermissions();
    
    return () => {
      mountedRef.current = false;
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [detectDevices, setPermissionState]);
};
