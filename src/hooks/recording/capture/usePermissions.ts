
import { useCallback, useState, useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Hook to check and request microphone permissions
 */
export const usePermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const permissionCheckInProgressRef = useRef(false);
  const retryCountRef = useRef(0);

  // Monitor permission changes
  useEffect(() => {
    const monitorPermission = async () => {
      if (!navigator.permissions) {
        console.log('[usePermissions] Permissions API not available');
        return;
      }

      try {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(status.state);
        
        // Listen for changes
        status.addEventListener('change', () => {
          console.log('[usePermissions] Permission status changed:', status.state);
          setPermissionStatus(status.state);
          
          if (status.state === 'granted') {
            toast.success("Microphone access granted");
          } else if (status.state === 'denied') {
            toast.error("Microphone access denied", {
              description: "Please allow microphone access in your browser settings"
            });
          }
        });
      } catch (err) {
        console.warn('[usePermissions] Error setting up permission monitoring:', err);
      }
    };
    
    monitorPermission();
  }, []);

  // Function to check if we have microphone permission
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous permission checks
    if (permissionCheckInProgressRef.current) {
      console.log('[usePermissions] Permission check already in progress');
      // If we already know permission is granted, return that
      if (permissionStatus === 'granted') {
        return true;
      }
      // Wait for ongoing check
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(permissionStatus === 'granted');
        }, 1000);
      });
    }
    
    permissionCheckInProgressRef.current = true;
    console.log('[usePermissions] Checking microphone permissions');
    
    try {
      // First try the Permissions API if available
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('[usePermissions] Permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'granted') {
            console.log('[usePermissions] Microphone permission already granted');
            setPermissionStatus('granted');
            permissionCheckInProgressRef.current = false;
            return true;
          } else if (permissionStatus.state === 'denied') {
            console.warn('[usePermissions] Microphone permission denied');
            setPermissionStatus('denied');
            toast.error("Microphone access denied", {
              description: "Please allow microphone access in your browser settings"
            });
            permissionCheckInProgressRef.current = false;
            return false;
          }
          // If status is prompt, we'll fall through to request permission
          setPermissionStatus('prompt');
        } catch (err) {
          console.warn('[usePermissions] Error checking permissions:', err);
          // Fall through to getUserMedia approach
        }
      }
      
      // Try to get a stream as a way to request permissions
      console.log('[usePermissions] Requesting temporary stream to check permissions');
      
      try {
        // Use a timeout to prevent hanging
        const streamPromise = navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          } 
        });
        
        const timeoutPromise = new Promise<MediaStream>((_, reject) => {
          setTimeout(() => reject(new Error("Permission request timed out")), 10000);
        });
        
        const stream = await Promise.race([streamPromise, timeoutPromise]);
        
        // If we get here, permission was granted
        console.log('[usePermissions] Successfully got microphone access');
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        
        // Update status
        setPermissionStatus('granted');
        
        // Reset retry counter on success
        retryCountRef.current = 0;
        
        // Show success toast (only on initial grant)
        if (permissionStatus !== 'granted') {
          toast.success("Microphone access granted");
        }
        
        permissionCheckInProgressRef.current = false;
        return true;
      } catch (error) {
        console.error('[usePermissions] Error requesting microphone permission:', error);
        
        // Update permission status based on error
        if (error instanceof DOMException) {
          if (error.name === 'NotAllowedError') {
            setPermissionStatus('denied');
          }
        }
        
        // Decide if we should retry
        if (retryCountRef.current < 2 && !(error instanceof DOMException && error.name === 'NotAllowedError')) {
          console.log(`[usePermissions] Scheduling retry (attempt ${retryCountRef.current + 1})`);
          retryCountRef.current++;
          
          permissionCheckInProgressRef.current = false;
          
          // Wait a bit and try again with a simpler request
          return new Promise(resolve => {
            setTimeout(async () => {
              try {
                // Simpler request for the retry
                const retryStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                retryStream.getTracks().forEach(track => track.stop());
                setPermissionStatus('granted');
                resolve(true);
              } catch (retryError) {
                console.error('[usePermissions] Retry also failed:', retryError);
                
                // Show error toast based on the error type
                if (retryError instanceof DOMException && retryError.name === 'NotAllowedError') {
                  toast.error("Microphone access denied", {
                    description: "Please allow microphone access in your browser settings"
                  });
                  setPermissionStatus('denied');
                } else if (retryError instanceof DOMException && retryError.name === 'NotFoundError') {
                  toast.error("No microphone found", {
                    description: "Please connect a microphone and try again"
                  });
                } else {
                  toast.error("Microphone error", {
                    description: retryError instanceof Error ? retryError.message : "Unknown error"
                  });
                }
                
                resolve(false);
              }
            }, 1500);
          });
        }
        
        // Show error toast
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          toast.error("Microphone access denied", {
            description: "Please allow microphone access in your browser settings"
          });
        } else if (error instanceof DOMException && error.name === 'NotFoundError') {
          toast.error("No microphone found", {
            description: "Please connect a microphone and try again"
          });
        } else {
          toast.error("Microphone error", {
            description: error instanceof Error ? error.message : "Unknown error"
          });
        }
        
        permissionCheckInProgressRef.current = false;
        return false;
      }
    } catch (error) {
      console.error('[usePermissions] Unexpected error during permission check:', error);
      toast.error("Unexpected error", {
        description: error instanceof Error ? error.message : "Unknown error checking permissions"
      });
      
      permissionCheckInProgressRef.current = false;
      return false;
    }
  }, [permissionStatus]);

  return {
    permissionStatus,
    checkPermissions
  };
};
