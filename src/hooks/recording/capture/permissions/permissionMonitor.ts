
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PermissionState } from "./types";

/**
 * Helper hook to monitor microphone permission changes
 */
export const usePermissionMonitor = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>(null);

  useEffect(() => {
    const monitorPermission = async () => {
      if (!navigator.permissions) {
        console.log('[usePermissionMonitor] Permissions API not available');
        return;
      }

      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(status.state as PermissionState);
        
        // Listen for changes
        status.addEventListener('change', () => {
          console.log('[usePermissionMonitor] Permission status changed:', status.state);
          setPermissionStatus(status.state as PermissionState);
          
          if (status.state === 'granted') {
            toast.success("Microphone access granted");
          } else if (status.state === 'denied') {
            toast.error("Microphone access denied", {
              description: "Please allow microphone access in your browser settings"
            });
          }
        });
      } catch (err) {
        console.warn('[usePermissionMonitor] Error setting up permission monitoring:', err);
      }
    };
    
    monitorPermission();
  }, []);

  return { permissionStatus, setPermissionStatus };
};
