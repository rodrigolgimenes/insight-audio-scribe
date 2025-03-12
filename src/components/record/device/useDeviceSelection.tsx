
import { useState, useEffect, useRef } from "react";

export function useDeviceSelection(
  onRefreshDevices?: () => void,
  permissionState: string = 'unknown'
) {
  const [hasAttemptedSelection, setHasAttemptedSelection] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const isMounted = useRef(true);
  const requestAttemptedRef = useRef(false);
  
  // Check permissions and handle errors gracefully
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (!navigator.permissions) {
          console.log('[useDeviceSelection] Permissions API not available');
          return;
        }
        
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (isMounted.current) {
          setPermissionStatus(result.state);
          console.log('[useDeviceSelection] Initial permission status:', result.state);
        }
        
        result.addEventListener('change', () => {
          if (isMounted.current) {
            const newState = result.state;
            console.log('[useDeviceSelection] Permission status changed:', newState);
            setPermissionStatus(newState);
            
            // Refresh devices when permissions change to granted
            if (newState === 'granted' && onRefreshDevices) {
              console.log('[useDeviceSelection] Permission granted, refreshing devices');
              onRefreshDevices();
            }
          }
        });
      } catch (error) {
        console.error('[useDeviceSelection] Error checking permissions:', error);
      }
    };
    
    checkPermissions();
    
    // If permission state is already granted, trigger a refresh
    if (permissionState === 'granted' && onRefreshDevices && !requestAttemptedRef.current) {
      console.log('[useDeviceSelection] Permission already granted, refreshing devices');
      onRefreshDevices();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [onRefreshDevices, permissionState]);

  const handleRequestPermission = async () => {
    if (!onRefreshDevices || isRequesting) return;
    
    setIsRequesting(true);
    requestAttemptedRef.current = true;
    console.log('[useDeviceSelection] Explicitly requesting permission');
    
    try {
      await onRefreshDevices();
      console.log('[useDeviceSelection] Permission request completed');
    } catch (error) {
      console.error('[useDeviceSelection] Error requesting permission:', error);
    } finally {
      if (isMounted.current) {
        setIsRequesting(false);
      }
    }
  };

  return {
    hasAttemptedSelection,
    setHasAttemptedSelection,
    isRequesting,
    permissionStatus,
    handleRequestPermission
  };
}
