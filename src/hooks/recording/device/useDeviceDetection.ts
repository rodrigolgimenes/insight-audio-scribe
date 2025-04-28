
import { useState, useCallback, useRef, useEffect } from "react";
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
  const maxRetries = 5; // Reduced from 10 to limit excessive retries
  const fallbackAttemptedRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const forcedApproachTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDashboardPage = useRef(window.location.pathname.includes('/app'));
  const deviceCacheRef = useRef<AudioDevice[]>([]);
  const deviceCacheTimeRef = useRef(0);
  const deviceCacheValidMs = 5000; // Cache is valid for 5 seconds

  // Clean up on unmount
  useEffect(() => {
    // Update isDashboardPage value
    isDashboardPage.current = window.location.pathname.includes('/app');
    
    const cleanup = () => {
      mountedRef.current = false;
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
      if (forcedApproachTimeoutRef.current) {
        clearTimeout(forcedApproachTimeoutRef.current);
      }
    };
    
    return cleanup;
  }, []);

  // Enhanced device detection with improved debounce and cache
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{devices: AudioDevice[], defaultId: string | null}> => {
    const now = Date.now();
    const elapsedSinceLastAttempt = now - lastDetectionTimeRef.current;
    
    // Check device cache first if not forcing refresh
    if (!forceRefresh && deviceCacheRef.current.length > 0 && 
        (now - deviceCacheTimeRef.current < deviceCacheValidMs)) {
      console.log('[useDeviceDetection] Using cached devices, age:', now - deviceCacheTimeRef.current, 'ms');
      return { devices: deviceCacheRef.current, defaultId: null };
    }
    
    // Prevent rapid successive detection attempts (but allow force refresh)
    if (!forceRefresh && detectionInProgressRef.current) {
      console.log('[useDeviceDetection] Device detection already in progress, skipping duplicate request');
      return { devices, defaultId: null };
    }
    
    // Add more aggressive debounce protection unless forced
    if (!forceRefresh && elapsedSinceLastAttempt < 1000) {
      console.log('[useDeviceDetection] Debouncing detection, last attempt:', elapsedSinceLastAttempt, 'ms ago');
      return { devices, defaultId: null };
    }
    
    lastDetectionTimeRef.current = now;
    
    // Clear any scheduled auto-retry
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
      autoRetryTimeoutRef.current = null;
    }
    
    if (forcedApproachTimeoutRef.current) {
      clearTimeout(forcedApproachTimeoutRef.current);
      forcedApproachTimeoutRef.current = null;
    }
    
    // Don't start detection if we have devices already and this isn't a forced refresh
    if (!forceRefresh && devices.length > 0) {
      console.log('[useDeviceDetection] Already have devices, skipping detection');
      return { devices, defaultId: null };
    }
    
    detectionInProgressRef.current = true;
    console.log('[useDeviceDetection] Detecting devices (attempt #' + (refreshAttempts + 1) + ')');
    setIsLoading(true);
    
    try {
      // First ensure we have permission
      // Pass showToast=false when on dashboard page
      const hasPermission = await requestPermission(!isDashboardPage.current);
      
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
      
      // Try a direct approach first - this should work in most browsers
      console.log('[useDeviceDetection] Fetching devices with standard approach...');
      const result = await getAudioDevices();
      let newDevices = result.devices;
      let defaultId = result.defaultId;
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      console.log(`[useDeviceDetection] Found ${newDevices.length} devices with standard approach`);
      
      // Only try fallback if no devices found AND forcing refresh AND haven't tried too many times
      if (newDevices.length === 0 && forceRefresh && refreshAttempts < 3) {
        // Try to get a temporary stream with different constraints
        try {
          console.log('[useDeviceDetection] No devices found, trying fallback approach');
          
          // Wait a moment
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Force browser to show all devices with a different getUserMedia call
          const tempStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: { ideal: 44100 },
              channelCount: { ideal: 1 }
            }
          });
          
          // Wait for browser to update
          await new Promise(resolve => setTimeout(resolve, 600));
          
          // Try fetching devices again
          console.log('[useDeviceDetection] Retrying device fetch after fallback stream...');
          const fallbackResult = await getAudioDevices();
          
          // Stop the temporary stream
          tempStream.getTracks().forEach(track => track.stop());
          
          if (fallbackResult.devices.length > 0) {
            console.log(`[useDeviceDetection] Fallback succeeded! Found ${fallbackResult.devices.length} devices`);
            newDevices = fallbackResult.devices;
            defaultId = fallbackResult.defaultId;
          } else {
            console.log('[useDeviceDetection] Fallback approach still found no devices');
          }
        } catch (fallbackErr) {
          console.error('[useDeviceDetection] Fallback approach failed:', fallbackErr);
        }
      }
      
      // Only update state and cache if devices changed or we have no devices yet
      const hasDeviceChanges = devices.length !== newDevices.length || 
        !devices.every((d, i) => d.deviceId === newDevices[i].deviceId);
      
      if (hasDeviceChanges || devices.length === 0) {
        // Update devices state
        setDevices(newDevices);
        
        // Update device cache
        deviceCacheRef.current = newDevices;
        deviceCacheTimeRef.current = now;
      }
      
      if (newDevices.length === 0 && refreshAttempts < maxRetries) {
        // Handle no devices found scenario
        await handleNoDevicesFound();
      } else {
        // Reset attempts counter on success
        setRefreshAttempts(0);
        fallbackAttemptedRef.current = false; // Reset for next time
      }
      
      setIsLoading(false);
      detectionInProgressRef.current = false;
      return { devices: newDevices, defaultId };
    } catch (err) {
      console.error('[useDeviceDetection] Error detecting devices:', err);
      
      // Try to extract more useful error info
      let errorMessage = "Unknown error";
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error(`[useDeviceDetection] Error name: ${err.name}, message: ${err.message}`);
      }
      
      await handleDetectionError(err);
      return { devices: [], defaultId: null };
    }
  }, [devices, getAudioDevices, requestPermission, refreshAttempts, maxRetries]);

  // Helper function to handle no devices found scenario
  const handleNoDevicesFound = useCallback(async () => {
    const newAttemptCount = refreshAttempts + 1;
    setRefreshAttempts(newAttemptCount);
    
    // Schedule auto-retry if we haven't tried too many times
    if (newAttemptCount < maxRetries) {
      // Progressive backoff with randomization for more natural retry pattern
      const delay = Math.min(1000 * Math.pow(1.5, newAttemptCount), 10000);
      
      console.log(`[useDeviceDetection] Scheduling auto-retry for device detection in ${delay}ms`);
      
      autoRetryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('[useDeviceDetection] Auto-retrying device detection');
          detectionInProgressRef.current = false;
          fallbackAttemptedRef.current = newAttemptCount % 2 === 0; 
          detectDevices(true);
        }
      }, delay);
    } else {
      console.log('[useDeviceDetection] Max retry attempts reached, giving up');
    }
    
    setIsLoading(false);
    detectionInProgressRef.current = false;
  }, [refreshAttempts, maxRetries, detectDevices]);

  // Helper function to handle detection errors
  const handleDetectionError = useCallback(async (err: unknown) => {
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
      const delay = Math.min(1500 * Math.pow(1.5, newAttemptCount), 10000); // Progressive backoff
      console.log(`[useDeviceDetection] Scheduling auto-retry after error in ${delay}ms`);
      
      autoRetryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('[useDeviceDetection] Auto-retrying after error');
          detectionInProgressRef.current = false;
          detectDevices(true);
        }
      }, delay);
    } else {
      console.log('[useDeviceDetection] Max retry attempts reached, giving up');
    }
    
    detectionInProgressRef.current = false;
  }, [refreshAttempts, maxRetries, detectDevices]);

  return {
    devices,
    isLoading,
    refreshAttempts,
    detectDevices,
    cleanup: () => {
      mountedRef.current = false;
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
      if (forcedApproachTimeoutRef.current) {
        clearTimeout(forcedApproachTimeoutRef.current);
      }
    }
  };
};
