
import { useState, useEffect, useRef } from "react";
import { PermissionState } from "./types";

/**
 * Hook to monitor microphone permission changes without showing notifications
 */
export const usePermissionMonitor = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('unknown');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const monitorPermission = async () => {
      if (!navigator.permissions) {
        console.log('[usePermissionMonitor] Permissions API not available');
        return;
      }

      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (!mountedRef.current) return;
        
        setPermissionStatus(status.state as PermissionState);
        
        // Listen for changes
        status.addEventListener('change', () => {
          console.log('[usePermissionMonitor] Permission status changed:', status.state);
          
          if (!mountedRef.current) return;
          
          setPermissionStatus(status.state as PermissionState);
        });
      } catch (err) {
        console.warn('[usePermissionMonitor] Error setting up permission monitoring:', err);
        
        if (!mountedRef.current) return;
        
        setPermissionStatus('unknown');
      }
    };
    
    monitorPermission();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { permissionStatus, setPermissionStatus };
};
