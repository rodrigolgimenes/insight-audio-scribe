
import { useEffect, useRef } from "react";

export const usePermissionMonitoring = (
  detectDevices: (forceRefresh: boolean) => Promise<any>,
  setPermissionState: (state: 'prompt' | 'granted' | 'denied' | 'unknown') => void
) => {
  const initialCheckDoneRef = useRef(false);
  const permissionEventBoundRef = useRef(false);

  useEffect(() => {
    // Set up device change monitoring
    const handleDeviceChange = () => {
      console.log('[usePermissionMonitoring] Device change detected');
      detectDevices(true);
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // Perform an initial permissions check
    const checkInitialPermissions = async () => {
      if (initialCheckDoneRef.current) return;
      initialCheckDoneRef.current = true;
      
      // First try the Permissions API if available
      if (navigator.permissions) {
        try {
          console.log('[usePermissionMonitoring] Checking permissions using Permissions API');
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          // Update initial state
          console.log('[usePermissionMonitoring] Initial permission state:', permissionStatus.state);
          setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
          
          // Set up permission change listener if not already done
          if (!permissionEventBoundRef.current) {
            permissionEventBoundRef.current = true;
            
            permissionStatus.addEventListener('change', () => {
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
          console.warn('[usePermissionMonitoring] Error checking permissions:', err);
          useFallbackPermissionCheck();
        }
      } else {
        console.log('[usePermissionMonitoring] Permissions API not available, using fallback method');
        useFallbackPermissionCheck();
      }
    };
    
    // Fallback method to check permissions when Permissions API is not available
    const useFallbackPermissionCheck = async () => {
      try {
        console.log('[usePermissionMonitoring] Attempting fallback permission check');
        // Try to access user media to determine permission state
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        console.log('[usePermissionMonitoring] Fallback check: permission granted');
        setPermissionState('granted');
        
        // Clean up the stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Also refresh devices since we now have permission
        detectDevices(true);
      } catch (err) {
        // Determine if permission is denied or prompt based on error message
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          console.log('[usePermissionMonitoring] Fallback check: permission denied');
          setPermissionState('denied');
        } else {
          console.log('[usePermissionMonitoring] Fallback check: permission status unknown', err);
          setPermissionState('unknown');
        }
      }
    };
    
    // Run the initial check
    checkInitialPermissions();
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [detectDevices, setPermissionState]);
};
