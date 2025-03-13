
import { useState, useCallback, useEffect, useRef } from "react";
import { useMicrophoneAccess } from "./capture/useMicrophoneAccess";
import { usePermissions } from "./capture/usePermissions";
import { useDeviceEnumeration } from "./capture/useDeviceEnumeration";
import { AudioDevice } from "./capture/types";
import { toast } from "sonner";

/**
 * Hook for accessing and managing audio devices
 */
export const useAudioCapture = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const refreshInProgressRef = useRef(false);
  const maxRetryAttemptsRef = useRef(5); // Increased from 3
  const currentRetryAttemptRef = useRef(0);
  const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackAttemptedRef = useRef(false);
  
  // Initialize permissions hook
  const { checkPermissions } = usePermissions();
  
  // Initialize device enumeration hook
  const { getAudioDevices, devicesFetched } = useDeviceEnumeration(checkPermissions);
  
  // Initialize microphone access hook
  const { requestMicrophoneAccess } = useMicrophoneAccess(
    checkPermissions,
    async (micStream, isSystemAudio) => {
      try {
        // This is a placeholder that will be replaced by the actual implementation
        // from useSystemAudio.ts when the hook is used
        console.log("[useAudioCapture] No system audio capture method provided");
        return null;
      } catch (error) {
        console.error("[useAudioCapture] Error in placeholder captureSystemAudio:", error);
        return null;
      }
    }
  );
  
  // Auto-retry cleanup
  useEffect(() => {
    return () => {
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, []);
  
  // Get audio devices with improved fallback strategy
  const getAudioDevicesWrapper = useCallback(async (): Promise<{ devices: AudioDevice[], defaultId: string | null }> => {
    try {
      // Prevent multiple simultaneous refreshes
      if (refreshInProgressRef.current) {
        console.log('[useAudioCapture] Refresh already in progress, skipping');
        return { devices: audioDevices, defaultId: defaultDeviceId };
      }
      
      // Cancel any pending auto-retry
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
        autoRetryTimeoutRef.current = null;
      }
      
      refreshInProgressRef.current = true;
      console.log('[useAudioCapture] Enumerating audio devices (attempt #' + (currentRetryAttemptRef.current + 1) + ')');
      
      // Check if it's been less than 3 seconds since the last refresh (reduced from 5)
      const now = Date.now();
      if (now - lastRefreshTime < 3000 && audioDevices.length > 0) {
        console.log('[useAudioCapture] Using cached devices from recent refresh');
        refreshInProgressRef.current = false;
        return { devices: audioDevices, defaultId: defaultDeviceId };
      }
      
      setLastRefreshTime(now);
      
      // Attempt direct device enumeration first
      const result = await getAudioDevices();
      const devices = result.devices; 
      const defaultId = result.defaultId;
      
      console.log('[useAudioCapture] Device refresh resulted in:', devices.length, 'devices');
      
      // Check if we got any devices
      if (devices.length === 0) {
        // Try a fallback approach if not already attempted
        if (!fallbackAttemptedRef.current) {
          fallbackAttemptedRef.current = true;
          console.log('[useAudioCapture] No devices found, trying fallback approach');
          
          try {
            // Try to force device discovery with alternative constraints
            const tempStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                // Different constraints than normal to force device discovery
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              }
            });
            
            // Wait longer for browser to update
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Try again with the temp stream active
            const fallbackResult = await getAudioDevices();
            
            // Stop the temporary stream
            tempStream.getTracks().forEach(track => track.stop());
            
            if (fallbackResult.devices.length > 0) {
              console.log('[useAudioCapture] Fallback approach succeeded!', fallbackResult.devices.length, 'devices found');
              setAudioDevices(fallbackResult.devices);
              setDefaultDeviceId(fallbackResult.defaultId);
              refreshInProgressRef.current = false;
              currentRetryAttemptRef.current = 0; // Reset counter on success
              fallbackAttemptedRef.current = false; // Reset for next time
              return fallbackResult;
            }
          } catch (fallbackErr) {
            console.error('[useAudioCapture] Fallback approach failed:', fallbackErr);
          }
        }
        
        // Increment retry attempt
        currentRetryAttemptRef.current++;
        
        if (currentRetryAttemptRef.current <= maxRetryAttemptsRef.current) {
          console.log(`[useAudioCapture] No devices found. Scheduling auto-retry (${currentRetryAttemptRef.current}/${maxRetryAttemptsRef.current})`);
          
          // Schedule an auto-retry with progressive delay
          const delay = Math.min(500 * Math.pow(1.5, currentRetryAttemptRef.current), 5000);
          
          autoRetryTimeoutRef.current = setTimeout(() => {
            console.log('[useAudioCapture] Auto-retrying device enumeration');
            refreshInProgressRef.current = false;
            fallbackAttemptedRef.current = currentRetryAttemptRef.current % 2 === 0; // Alternate approaches
            getAudioDevicesWrapper();
          }, delay);
          
          // Don't show notification on first retry
          if (currentRetryAttemptRef.current > 1) {
            toast.info("Trying to detect microphones...", {
              id: "retry-device-detection",
              duration: 3000
            });
          }
        } else {
          // We've reached max retries, show error
          toast.error("No microphones found", {
            description: "Please check your microphone connection and refresh the page",
            id: "no-mics-max-retries"
          });
          
          // Reset retry counter for next manual attempt
          currentRetryAttemptRef.current = 0;
          fallbackAttemptedRef.current = false;
        }
      } else {
        // We found devices, reset retry counter
        currentRetryAttemptRef.current = 0;
        fallbackAttemptedRef.current = false;
        
        // Success toast removed (this is where it was)
        
        // Update our state
        setAudioDevices(devices);
        setDefaultDeviceId(defaultId);
      }
      
      refreshInProgressRef.current = false;
      return { devices, defaultId };
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      
      // Increment retry attempt
      currentRetryAttemptRef.current++;
      
      if (currentRetryAttemptRef.current <= maxRetryAttemptsRef.current) {
        console.log(`[useAudioCapture] Error occurred. Scheduling auto-retry (${currentRetryAttemptRef.current}/${maxRetryAttemptsRef.current})`);
        
        // Schedule an auto-retry with progressive delay
        const delay = Math.min(500 * Math.pow(1.5, currentRetryAttemptRef.current), 5000);
        
        autoRetryTimeoutRef.current = setTimeout(() => {
          console.log('[useAudioCapture] Auto-retrying after error');
          refreshInProgressRef.current = false;
          fallbackAttemptedRef.current = currentRetryAttemptRef.current % 2 === 0; // Alternate approaches
          getAudioDevicesWrapper();
        }, delay);
      } else {
        // We've reached max retries, show error
        toast.error("Failed to detect microphones", {
          description: error instanceof Error ? error.message : "Unknown error",
          id: "device-error-max-retries"
        });
        
        // Reset retry counter for next manual attempt
        currentRetryAttemptRef.current = 0;
        fallbackAttemptedRef.current = false;
      }
      
      refreshInProgressRef.current = false;
      return { devices: [] as AudioDevice[], defaultId: null };
    }
  }, [getAudioDevices, audioDevices, defaultDeviceId, lastRefreshTime]);
  
  // Initial device enumeration - only once at mount
  useEffect(() => {
    getAudioDevicesWrapper();
    
    // Listen for device changes
    const handleDeviceChange = () => {
      console.log('[useAudioCapture] Device change detected by browser');
      // Reset flags to force a thorough refresh
      fallbackAttemptedRef.current = false;
      refreshInProgressRef.current = false;
      currentRetryAttemptRef.current = 0;
      getAudioDevicesWrapper();
    };
    
    // Add device change listener
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, [getAudioDevicesWrapper]);
  
  return {
    audioDevices,
    defaultDeviceId,
    getAudioDevices: getAudioDevicesWrapper,
    requestMicrophoneAccess,
    checkPermissions
  };
};
