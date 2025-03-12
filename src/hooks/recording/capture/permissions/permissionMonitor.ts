import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PermissionState } from "./types";

/**
 * Hook to monitor microphone permission changes
 */
export const usePermissionMonitor = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('unknown');
  const permissionCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNotifiedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Mark component as mounted
    mountedRef.current = true;
    
    const monitorPermission = async () => {
      if (!navigator.permissions) {
        console.log('[usePermissionMonitor] Permissions API not available');
        // Fallback to checking via getUserMedia after a short delay
        permissionCheckTimerRef.current = setTimeout(() => {
          checkPermissionWithFallback();
        }, 1000);
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
          
          // Show appropriate toast
          if (status.state === 'granted') {
            if (!hasNotifiedRef.current) {
              toast.success("Microphone access granted", {
                id: "mic-permission-success"
              });
              hasNotifiedRef.current = true;
            }
          } else if (status.state === 'denied') {
            toast.error("Microphone access denied", {
              description: "Please allow microphone access in your browser settings",
              id: "mic-permission-denied"
            });
          }
        });
      } catch (err) {
        console.warn('[usePermissionMonitor] Error setting up permission monitoring:', err);
        
        if (!mountedRef.current) return;
        
        // Fallback to checking via getUserMedia
        setPermissionStatus('unknown');
        checkPermissionWithFallback();
      }
    };
    
    // Fallback method to check permissions using getUserMedia
    const checkPermissionWithFallback = async () => {
      try {
        console.log('[usePermissionMonitor] Checking permissions with getUserMedia fallback');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!mountedRef.current) {
          // Clean up stream if component unmounted
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // We got a stream, so permission is granted
        setPermissionStatus('granted');
        
        // Clean up the stream since we only needed it to check permissions
        stream.getTracks().forEach(track => track.stop());
        
        if (!hasNotifiedRef.current) {
          toast.success("Microphone access granted", {
            id: "mic-permission-success"
          });
          hasNotifiedRef.current = true;
        }
      } catch (error) {
        if (!mountedRef.current) return;
        
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          // User denied permission
          setPermissionStatus('denied');
          toast.error("Microphone access denied", {
            description: "Please allow microphone access in your browser settings",
            id: "mic-permission-denied"
          });
        } else if (error instanceof DOMException && error.name === 'NotFoundError') {
          // No microphone available
          setPermissionStatus('denied');
          toast.error("No microphone found", {
            description: "Please connect a microphone and try again",
            id: "no-mic-found"
          });
        } else {
          // Other error
          console.error('[usePermissionMonitor] Fallback permission check error:', error);
          setPermissionStatus('unknown');
        }
      }
    };
    
    // Start monitoring
    monitorPermission();
    
    // Check permissions periodically in browsers without the Permissions API
    if (!navigator.permissions) {
      const periodicCheckInterval = setInterval(() => {
        // Only check periodically if we don't have a clear state yet
        if (permissionStatus === 'unknown' && mountedRef.current) {
          checkPermissionWithFallback();
        }
      }, 10000); // Every 10 seconds
      
      // Clean up interval on unmount
      return () => {
        clearInterval(periodicCheckInterval);
      };
    }
    
    // Clean up on unmount
    return () => {
      mountedRef.current = false;
      if (permissionCheckTimerRef.current) {
        clearTimeout(permissionCheckTimerRef.current);
      }
    };
  }, [permissionStatus]);

  return { permissionStatus, setPermissionStatus };
};
