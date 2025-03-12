
import { useState, useEffect, useRef } from "react";

export function useDeviceSelection(
  onRefreshDevices?: () => void,
  permissionState: string = 'unknown'
) {
  const [hasAttemptedSelection, setHasAttemptedSelection] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const isMounted = useRef(true);
  
  // Check permissions and handle errors gracefully
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (!navigator.permissions) {
          console.log('[DeviceSelector] Permissions API not available');
          return;
        }
        
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (isMounted.current) {
          setPermissionStatus(result.state);
        }
        
        result.addEventListener('change', () => {
          if (isMounted.current) {
            setPermissionStatus(result.state);
            // Refresh devices when permissions change
            if (result.state === 'granted' && onRefreshDevices) {
              onRefreshDevices();
            }
          }
        });
      } catch (error) {
        console.error('[DeviceSelector] Error checking permissions:', error);
      }
    };
    
    checkPermissions();
    
    return () => {
      isMounted.current = false;
    };
  }, [onRefreshDevices]);

  const handleRequestPermission = async () => {
    if (!onRefreshDevices || isRequesting) return;
    
    setIsRequesting(true);
    try {
      await onRefreshDevices();
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
