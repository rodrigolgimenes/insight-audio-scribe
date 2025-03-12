import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { AudioDevice } from "@/hooks/recording/capture/types";

/**
 * Enhanced hook for robust device detection and permission handling
 */
export const useRobustDeviceDetection = (
  getAudioDevices: () => Promise<{devices: AudioDevice[], defaultId: string | null}>,
  checkPermissions: () => Promise<boolean>
) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'|'unknown'>('unknown');
  const [hasAttemptedPermission, setHasAttemptedPermission] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const mountedRef = useRef(true);
  const detectionInProgressRef = useRef(false);

  // Enhanced permission check with multiple retry strategies
  const requestPermission = useCallback(async (showToast = true): Promise<boolean> => {
    if (detectionInProgressRef.current) {
      console.log('[useRobustDeviceDetection] Permission check already in progress, skipping duplicate request');
      return false;
    }

    detectionInProgressRef.current = true;
    console.log('[useRobustDeviceDetection] Requesting microphone permission explicitly...');
    
    try {
      setHasAttemptedPermission(true);
      
      // Check with the Permissions API first if available
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (!mountedRef.current) return false;
          
          console.log('[useRobustDeviceDetection] Permission status:', permissionStatus.state);
          setPermissionState(permissionStatus.state);
          
          if (permissionStatus.state === 'granted') {
            console.log('[useRobustDeviceDetection] Permission already granted via Permissions API');
            detectionInProgressRef.current = false;
            return true;
          } else if (permissionStatus.state === 'denied') {
            if (showToast) {
              toast.error("Microphone access denied", {
                description: "Please allow microphone access in your browser settings and refresh the page",
                duration: 5000,
                id: "mic-permission-denied"
              });
            }
            detectionInProgressRef.current = false;
            return false;
          }
          // If it's 'prompt', we'll continue to the getUserMedia approach
        } catch (err) {
          console.warn('[useRobustDeviceDetection] Error using Permissions API:', err);
          // Continue to the getUserMedia approach
        }
      }
      
      // Request access with getUserMedia
      try {
        console.log('[useRobustDeviceDetection] Requesting permission with getUserMedia...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!mountedRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return false;
        }
        
        // If we get here, permission has been granted
        console.log('[useRobustDeviceDetection] Permission granted successfully!');
        setPermissionState('granted');
        
        // Always stop the temporary stream
        stream.getTracks().forEach(track => track.stop());
        
        if (showToast) {
          toast.success("Microphone access granted", {
            id: "mic-permission-granted"
          });
        }
        
        detectionInProgressRef.current = false;
        return true;
      } catch (err) {
        console.error('[useRobustDeviceDetection] getUserMedia error:', err);
        
        if (!mountedRef.current) return false;
        
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
            setPermissionState('denied');
            if (showToast) {
              toast.error("Microphone access denied", {
                description: "Please allow microphone access in your browser settings and refresh the page",
                duration: 5000,
                id: "mic-permission-denied"
              });
            }
          } else if (err.name === 'NotFoundError') {
            if (showToast) {
              toast.error("No microphone found", {
                description: "Please connect a microphone and try again",
                id: "no-mic-found"
              });
            }
          }
        } else {
          if (showToast) {
            toast.error("Failed to access microphone", {
              description: err instanceof Error ? err.message : "Unknown error",
              id: "mic-access-failed"
            });
          }
        }
        
        detectionInProgressRef.current = false;
        return false;
      }
    } catch (err) {
      console.error('[useRobustDeviceDetection] Unexpected error during permission request:', err);
      if (mountedRef.current && showToast) {
        toast.error("Failed to access microphone", {
          description: err instanceof Error ? err.message : "Unknown error",
          id: "mic-access-failed"
        });
      }
      detectionInProgressRef.current = false;
      return false;
    }
  }, []);

  // Enhanced device detection with improved error handling and recovery strategies
  const detectDevices = useCallback(async (forceRefresh = false): Promise<AudioDevice[]> => {
    if (detectionInProgressRef.current && !forceRefresh) {
      console.log('[useRobustDeviceDetection] Device detection already in progress, skipping duplicate request');
      return devices;
    }
    
    detectionInProgressRef.current = true;
    console.log('[useRobustDeviceDetection] Detecting devices...');
    setIsLoading(true);
    
    try {
      // First ensure we have permission
      const hasPermission = await requestPermission(false);
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return [];
      }
      
      if (!hasPermission) {
        console.warn('[useRobustDeviceDetection] Permission not granted, cannot enumerate devices');
        setIsLoading(false);
        detectionInProgressRef.current = false;
        return [];
      }
      
      // Get devices with our existing function
      console.log('[useRobustDeviceDetection] Fetching devices...');
      const { devices: newDevices } = await getAudioDevices();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return [];
      }
      
      console.log(`[useRobustDeviceDetection] Found ${newDevices.length} devices`);
      setDevices(newDevices);
      
      // If no devices found, show appropriate toast
      if (newDevices.length === 0) {
        setRefreshAttempts(prev => prev + 1);
        
        // Only show toast after multiple failed attempts
        if (refreshAttempts >= 1) {
          toast.warning("No microphones detected", {
            description: "Please check your microphone connection and try again",
            id: "no-mics-found"
          });
        }
        
        // If browser issue is suspected, suggest refresh
        if (refreshAttempts >= 2) {
          toast.info("Try refreshing your browser", {
            description: "Some browsers require a refresh after connecting a device",
            id: "try-refresh",
            duration: 8000,
            action: {
              label: "Refresh Page",
              onClick: () => window.location.reload()
            }
          });
        }
      } else {
        // Reset attempts counter on success
        setRefreshAttempts(0);
      }
      
      setIsLoading(false);
      detectionInProgressRef.current = false;
      return newDevices;
    } catch (err) {
      console.error('[useRobustDeviceDetection] Error detecting devices:', err);
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return [];
      }
      
      setIsLoading(false);
      detectionInProgressRef.current = false;
      
      // Increment attempt counter
      setRefreshAttempts(prev => prev + 1);
      
      // Show error toast after multiple failures
      if (refreshAttempts >= 1) {
        toast.error("Error detecting microphones", {
          description: err instanceof Error ? err.message : "Unknown error occurred",
          id: "device-detection-error"
        });
      }
      
      return [];
    }
  }, [devices, getAudioDevices, requestPermission, refreshAttempts]);

  // Initialize on mount with device detection
  useEffect(() => {
    console.log('[useRobustDeviceDetection] Initializing device detection...');
    detectDevices();
    
    // Set up device change monitoring
    const handleDeviceChange = () => {
      console.log('[useRobustDeviceDetection] Device change detected');
      detectDevices(true);
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // Also monitor permission changes if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(permissionStatus => {
          permissionStatus.addEventListener('change', () => {
            console.log('[useRobustDeviceDetection] Permission change detected:', permissionStatus.state);
            setPermissionState(permissionStatus.state);
            if (permissionStatus.state === 'granted') {
              detectDevices(true);
            }
          });
        })
        .catch(err => console.warn('[useRobustDeviceDetection] Error setting up permission monitoring:', err));
    }
    
    return () => {
      mountedRef.current = false;
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [detectDevices]);

  return {
    devices,
    isLoading,
    permissionState,
    hasAttemptedPermission,
    refreshAttempts,
    detectDevices,
    requestPermission
  };
};
