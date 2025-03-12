
import { useEffect } from "react";

export const usePermissionMonitoring = (
  detectDevices: (forceRefresh: boolean) => Promise<any>,
  setPermissionState: (state: 'prompt' | 'granted' | 'denied' | 'unknown') => void
) => {
  useEffect(() => {
    // Set up device change monitoring
    const handleDeviceChange = () => {
      console.log('[usePermissionMonitoring] Device change detected');
      detectDevices(true);
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // Also monitor permission changes if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(permissionStatus => {
          // Update initial state
          console.log('[usePermissionMonitoring] Initial permission state:', permissionStatus.state);
          setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
          
          // Listen for permission state changes
          permissionStatus.addEventListener('change', () => {
            console.log('[usePermissionMonitoring] Permission change detected:', permissionStatus.state);
            setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
            
            // If permission becomes granted, refresh device list
            if (permissionStatus.state === 'granted') {
              console.log('[usePermissionMonitoring] Permission granted, refreshing devices');
              detectDevices(true);
            }
          });
        })
        .catch(err => {
          console.warn('[usePermissionMonitoring] Error setting up permission monitoring:', err);
          // Set a fallback state when permissions API fails
          setPermissionState('unknown');
        });
    } else {
      console.log('[usePermissionMonitoring] Permissions API not available');
      setPermissionState('unknown');
    }
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [detectDevices, setPermissionState]);
};
