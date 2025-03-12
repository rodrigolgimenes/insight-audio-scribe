
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { AudioDevice } from "@/hooks/recording/capture/types";

export const useDeviceDetection = (
  getAudioDevices: () => Promise<{devices: AudioDevice[], defaultId: string | null}>,
  requestPermission: (showToast: boolean) => Promise<boolean>
) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const detectionInProgressRef = useRef(false);
  const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const maxRetries = 8;

  // Clean up on unmount
  const cleanup = () => {
    mountedRef.current = false;
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
    }
  };

  // Enhanced device detection with improved error handling and recovery strategies
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{devices: AudioDevice[], defaultId: string | null}> => {
    if (detectionInProgressRef.current && !forceRefresh) {
      console.log('[useDeviceDetection] Device detection already in progress, skipping duplicate request');
      return { devices, defaultId: null };
    }
    
    // Clear any scheduled auto-retry
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
      autoRetryTimeoutRef.current = null;
    }
    
    detectionInProgressRef.current = true;
    console.log('[useDeviceDetection] Detecting devices (attempt #' + (refreshAttempts + 1) + ')');
    setIsLoading(true);
    
    try {
      // First ensure we have permission
      const hasPermission = await requestPermission(false);
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      if (!hasPermission) {
        console.warn('[useDeviceDetection] Permission not granted, cannot enumerate devices');
        setIsLoading(false);
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      // Get devices with our existing function
      console.log('[useDeviceDetection] Fetching devices...');
      const result = await getAudioDevices();
      const newDevices = result.devices;
      const defaultId = result.defaultId;
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      console.log(`[useDeviceDetection] Found ${newDevices.length} devices`);
      
      // Update devices
      setDevices(newDevices);
      
      // If no devices found, schedule an auto-retry
      if (newDevices.length === 0) {
        handleNoDevicesFound();
      } else {
        // Reset attempts counter on success
        setRefreshAttempts(0);
        
        // Remove success toast - we don't want to show it anymore
        // Previously had a toast.success here
      }
      
      setIsLoading(false);
      detectionInProgressRef.current = false;
      return { devices: newDevices, defaultId };
    } catch (err) {
      handleDetectionError(err);
      return { devices: [], defaultId: null };
    }
  }, [devices, getAudioDevices, requestPermission, refreshAttempts, maxRetries]);

  // Helper function to handle no devices found scenario
  const handleNoDevicesFound = useCallback(() => {
    const newAttemptCount = refreshAttempts + 1;
    setRefreshAttempts(newAttemptCount);
    
    // Schedule auto-retry if we haven't tried too many times
    if (newAttemptCount < maxRetries) {
      const delay = Math.min(1000 * (1 + newAttemptCount * 0.5), 5000); // Progressive backoff
      console.log(`[useDeviceDetection] Scheduling auto-retry for device detection in ${delay}ms`);
      
      autoRetryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('[useDeviceDetection] Auto-retrying device detection');
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
  }, [refreshAttempts, maxRetries]);

  // Helper function to handle detection errors
  const handleDetectionError = useCallback((err: unknown) => {
    console.error('[useDeviceDetection] Error detecting devices:', err);
    
    if (!mountedRef.current) {
      detectionInProgressRef.current = false;
      return;
    }
    
    setIsLoading(false);
    
    // Increment attempt counter
    const newAttemptCount = refreshAttempts + 1;
    setRefreshAttempts(newAttemptCount);
    
    // Schedule auto-retry if we haven't tried too many times
    if (newAttemptCount < maxRetries) {
      const delay = Math.min(1000 * (1 + newAttemptCount * 0.5), 5000); // Progressive backoff
      console.log(`[useDeviceDetection] Scheduling auto-retry after error in ${delay}ms`);
      
      autoRetryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('[useDeviceDetection] Auto-retrying after error');
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
  }, [refreshAttempts, maxRetries]);

  return {
    devices,
    isLoading,
    refreshAttempts,
    detectDevices,
    cleanup
  };
};
