
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to check and request microphone permissions
 */
export const usePermissions = () => {
  // Function to check if we have microphone permission
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    console.log('[usePermissions] Checking microphone permissions');
    
    try {
      // First try the Permissions API if available
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('[usePermissions] Permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'granted') {
            console.log('[usePermissions] Microphone permission already granted');
            return true;
          } else if (permissionStatus.state === 'denied') {
            console.warn('[usePermissions] Microphone permission denied');
            toast.error("Microphone access denied", {
              description: "Please allow microphone access in your browser settings"
            });
            return false;
          }
          // If status is prompt, we'll fall through to request permission
        } catch (err) {
          console.warn('[usePermissions] Error checking permissions:', err);
          // Fall through to getUserMedia approach
        }
      }
      
      // Try to get a stream as a way to request permissions
      console.log('[usePermissions] Requesting temporary stream to check permissions');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission was granted
      console.log('[usePermissions] Successfully got microphone access');
      
      // Clean up stream
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('[usePermissions] Error requesting microphone permission:', error);
      
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
      
      return false;
    }
  }, []);

  return {
    checkPermissions
  };
};
