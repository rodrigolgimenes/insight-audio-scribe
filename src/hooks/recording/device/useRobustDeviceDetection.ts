
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
  const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 8; // Increased max retries

  // Clear auto-retry on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, []);

  // Check if this browser is known to have issues with device detection
  const checkBrowserCompatibility = useCallback(() => {
    const ua = navigator.userAgent;
    const isMobileSafari = /iPhone|iPad|iPod/.test(ua) && !ua.includes('CriOS') && !ua.includes('FxiOS');
    const isOldEdge = /Edge\/\d+/.test(ua);
    const isIE = /Trident|MSIE/.test(ua);
    
    if (isMobileSafari || isOldEdge || isIE) {
      console.warn('[useRobustDeviceDetection] Potentially problematic browser detected:', ua);
      return false;
    }
    return true;
  }, []);

  // Enhanced permission check with multiple retry strategies
  const requestPermission = useCallback(async (showToast = true): Promise<boolean> => {
    if (detectionInProgressRef.current) {
      console.log('[useRobustDeviceDetection] Permission check already in progress, skipping duplicate request');
      return permissionState === 'granted';
    }

    detectionInProgressRef.current = true;
    console.log('[useRobustDeviceDetection] Requesting microphone permission explicitly...');
    
    try {
      setHasAttemptedPermission(true);
      setIsLoading(true);
      
      // Check if browser is fully compatible
      const isCompatible = checkBrowserCompatibility();
      if (!isCompatible && showToast) {
        toast.info("Your browser may have limited microphone support", {
          description: "For best results, use Chrome, Firefox, or Edge",
          duration: 5000
        });
      }
      
      // Use our improved checkPermissions method
      const hasPermission = await checkPermissions();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return false;
      }
      
      // Update our permission state based on the result
      setPermissionState(hasPermission ? 'granted' : 'denied');
      setIsLoading(false);
      detectionInProgressRef.current = false;
      
      if (hasPermission && showToast) {
        toast.success("Microphone access granted", {
          id: "mic-permission-granted",
          duration: 3000
        });
      }
      
      return hasPermission;
    } catch (err) {
      console.error('[useRobustDeviceDetection] Unexpected error during permission request:', err);
      
      if (mountedRef.current) {
        setIsLoading(false);
        setPermissionState('unknown');
        
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
  }, [checkPermissions, permissionState, checkBrowserCompatibility]);

  // Enhanced device detection with improved error handling and recovery strategies
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{devices: AudioDevice[], defaultId: string | null}> => {
    if (detectionInProgressRef.current && !forceRefresh) {
      console.log('[useRobustDeviceDetection] Device detection already in progress, skipping duplicate request');
      return { devices, defaultId: null };
    }
    
    // Clear any scheduled auto-retry
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
      autoRetryTimeoutRef.current = null;
    }
    
    detectionInProgressRef.current = true;
    console.log('[useRobustDeviceDetection] Detecting devices (attempt #' + (refreshAttempts + 1) + ')');
    setIsLoading(true);
    
    try {
      // First ensure we have permission
      const hasPermission = await requestPermission(false);
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      if (!hasPermission) {
        console.warn('[useRobustDeviceDetection] Permission not granted, cannot enumerate devices');
        setIsLoading(false);
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      // Get devices with our existing function
      console.log('[useRobustDeviceDetection] Fetching devices...');
      const result = await getAudioDevices();
      const newDevices = result.devices;
      const defaultId = result.defaultId;
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      console.log(`[useRobustDeviceDetection] Found ${newDevices.length} devices`);
      
      // Update devices
      setDevices(newDevices);
      
      // If no devices found, schedule an auto-retry
      if (newDevices.length === 0) {
        const newAttemptCount = refreshAttempts + 1;
        setRefreshAttempts(newAttemptCount);
        
        // Schedule auto-retry if we haven't tried too many times
        if (newAttemptCount < maxRetries) {
          const delay = Math.min(1000 * (1 + newAttemptCount * 0.5), 5000); // Progressive backoff
          console.log(`[useRobustDeviceDetection] Scheduling auto-retry for device detection in ${delay}ms`);
          
          autoRetryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log('[useRobustDeviceDetection] Auto-retrying device detection');
              detectionInProgressRef.current = false;
              detectDevices(true);
            }
          }, delay);
        }
        
        // Only show toast after multiple failed attempts
        if (newAttemptCount === 3) {
          toast.warning("Still trying to detect microphones", {
            description: "This may take a moment...",
            id: "still-trying-mics"
          });
        }
        
        // If browser issue is suspected, suggest refresh
        if (newAttemptCount >= 5) {
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
        
        // Show success toast only once
        if (refreshAttempts > 0) {
          toast.success(`Found ${newDevices.length} microphone(s)`, {
            description: "You can now select a microphone from the dropdown"
          });
        }
      }
      
      setIsLoading(false);
      detectionInProgressRef.current = false;
      return { devices: newDevices, defaultId };
    } catch (err) {
      console.error('[useRobustDeviceDetection] Error detecting devices:', err);
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      setIsLoading(false);
      
      // Increment attempt counter
      const newAttemptCount = refreshAttempts + 1;
      setRefreshAttempts(newAttemptCount);
      
      // Schedule auto-retry if we haven't tried too many times
      if (newAttemptCount < maxRetries) {
        const delay = Math.min(1000 * (1 + newAttemptCount * 0.5), 5000); // Progressive backoff
        console.log(`[useRobustDeviceDetection] Scheduling auto-retry after error in ${delay}ms`);
        
        autoRetryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            console.log('[useRobustDeviceDetection] Auto-retrying after error');
            detectionInProgressRef.current = false;
            detectDevices(true);
          }
        }, delay);
      }
      
      // Show error toast after multiple failures
      if (newAttemptCount === 3) {
        toast.error("Having trouble detecting microphones", {
          description: err instanceof Error ? err.message : "Unknown error occurred",
          id: "device-detection-error"
        });
      }
      
      detectionInProgressRef.current = false;
      return { devices: [], defaultId: null };
    }
  }, [devices, getAudioDevices, requestPermission, refreshAttempts, maxRetries]);

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
          // Update initial state
          setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
          
          permissionStatus.addEventListener('change', () => {
            console.log('[useRobustDeviceDetection] Permission change detected:', permissionStatus.state);
            setPermissionState(permissionStatus.state as 'prompt'|'granted'|'denied');
            if (permissionStatus.state === 'granted') {
              detectDevices(true);
            }
          });
        })
        .catch(err => console.warn('[useRobustDeviceDetection] Error setting up permission monitoring:', err));
    }
    
    // Fallback detection for older browsers
    const checkForReconnectedDevices = () => {
      if (devices.length === 0 && mountedRef.current) {
        console.log('[useRobustDeviceDetection] Performing periodic device check');
        detectDevices(true);
      }
    };
    
    // Check periodically for reconnected devices
    const periodicCheckInterval = setInterval(checkForReconnectedDevices, 10000);
    
    return () => {
      mountedRef.current = false;
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      clearInterval(periodicCheckInterval);
      
      // Clear any scheduled auto-retry
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, [detectDevices, devices.length]);

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
