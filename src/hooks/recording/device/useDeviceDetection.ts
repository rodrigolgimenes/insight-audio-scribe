
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
  const maxRetries = 10; // Increased from 8
  const fallbackAttemptedRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const forcedApproachTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
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

  // Enhanced device detection with improved error handling and recovery strategies
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{devices: AudioDevice[], defaultId: string | null}> => {
    const now = Date.now();
    const elapsedSinceLastAttempt = now - lastDetectionTimeRef.current;
    
    // Prevent rapid successive detection attempts (but allow force refresh)
    if (!forceRefresh && detectionInProgressRef.current) {
      console.log('[useDeviceDetection] Device detection already in progress, skipping duplicate request');
      return { devices, defaultId: null };
    }
    
    // Add some debounce protection unless forced
    if (!forceRefresh && elapsedSinceLastAttempt < 300) {
      console.log('[useDeviceDetection] Skipping detection due to recent attempt', elapsedSinceLastAttempt);
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
      
      // If no devices found, try a fallback approach (only on first few attempts)
      if (newDevices.length === 0 && refreshAttempts < 5) {
        // Try to get a temporary stream with different constraints
        try {
          console.log('[useDeviceDetection] No devices found, trying fallback approach');
          
          // Wait a moment
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Force browser to show all devices with a different getUserMedia call
          const tempStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              // Use different constraints to force device discovery
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              latency: { ideal: 0 }, // Low latency might trigger different device handling
              channelCount: { ideal: 1 } // Mono might be compatible with more devices
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
      
      // Update devices state
      setDevices(newDevices);
      
      if (newDevices.length === 0) {
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
      // Start with shorter intervals, then gradually increase
      let delay: number;
      
      if (newAttemptCount < 3) {
        // Very short initial delays (300-600ms)
        delay = 300 + Math.random() * 300;
      } else if (newAttemptCount < 6) {
        // Medium delays (800-1500ms)
        delay = 800 + Math.random() * 700;
      } else {
        // Longer delays with progressive backoff (1500-5000ms)
        delay = Math.min(1500 + (newAttemptCount * 500) + (Math.random() * 500), 5000);
      }
      
      console.log(`[useDeviceDetection] Scheduling auto-retry for device detection in ${delay}ms`);
      
      autoRetryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('[useDeviceDetection] Auto-retrying device detection');
          detectionInProgressRef.current = false;
          fallbackAttemptedRef.current = newAttemptCount % 2 === 0; // Alternate between approaches
          detectDevices(true);
        }
      }, delay);
      
      // On the 4th attempt, try a completely different approach
      if (newAttemptCount === 4) {
        forcedApproachTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            console.log('[useDeviceDetection] Trying forced permission approach');
            try {
              // Reset audio context which can sometimes help
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              audioContext.resume().then(() => {
                console.log('[useDeviceDetection] Audio context resumed');
                // Close it after a moment
                setTimeout(() => audioContext.close(), 500);
              });
              
              // Force a permission prompt with yet another constraint set
              navigator.mediaDevices.getUserMedia({
                audio: {
                  deviceId: "default",
                  echoCancellation: true,
                  noiseSuppression: true
                }
              }).then(stream => {
                stream.getTracks().forEach(track => track.stop());
                
                // Wait and refresh devices
                setTimeout(() => {
                  if (mountedRef.current) {
                    console.log('[useDeviceDetection] Refreshing after forced approach');
                    detectionInProgressRef.current = false;
                    detectDevices(true);
                  }
                }, 500);
              }).catch(err => {
                console.error('[useDeviceDetection] Forced approach failed:', err);
              });
            } catch (err) {
              console.error('[useDeviceDetection] Error in forced approach:', err);
            }
          }
        }, 2000);
      }
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
      const delay = Math.min(800 * Math.pow(1.2, newAttemptCount), 5000); // Progressive backoff
      console.log(`[useDeviceDetection] Scheduling auto-retry after error in ${delay}ms`);
      
      autoRetryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('[useDeviceDetection] Auto-retrying after error');
          detectionInProgressRef.current = false;
          detectDevices(true);
        }
      }, delay);
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
