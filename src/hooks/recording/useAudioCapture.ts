
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
  const maxRetryAttemptsRef = useRef(3);
  const currentRetryAttemptRef = useRef(0);
  const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Get audio devices
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
      
      // Check if it's been less than 5 seconds since the last refresh
      const now = Date.now();
      if (now - lastRefreshTime < 5000 && audioDevices.length > 0) {
        console.log('[useAudioCapture] Using cached devices from recent refresh');
        refreshInProgressRef.current = false;
        return { devices: audioDevices, defaultId: defaultDeviceId };
      }
      
      setLastRefreshTime(now);
      
      // Get devices from our device enumeration hook
      const result = await getAudioDevices();
      const devices = result.devices; 
      const defaultId = result.defaultId;
      
      console.log('[useAudioCapture] Device refresh resulted in:', devices.length, 'devices');
      
      // Check if we got any devices
      if (devices.length === 0) {
        // Increment retry attempt
        currentRetryAttemptRef.current++;
        
        if (currentRetryAttemptRef.current <= maxRetryAttemptsRef.current) {
          console.log(`[useAudioCapture] No devices found. Scheduling auto-retry (${currentRetryAttemptRef.current}/${maxRetryAttemptsRef.current})`);
          
          // Schedule an auto-retry
          autoRetryTimeoutRef.current = setTimeout(() => {
            console.log('[useAudioCapture] Auto-retrying device enumeration');
            refreshInProgressRef.current = false;
            getAudioDevicesWrapper();
          }, 2000);
          
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
        }
      } else {
        // We found devices, reset retry counter
        currentRetryAttemptRef.current = 0;
        
        // Show success message only if this came after a failed attempt
        if (audioDevices.length === 0) {
          toast.success(`Found ${devices.length} microphone(s)`, {
            description: "Select a microphone from the dropdown"
          });
        }
        
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
        
        // Schedule an auto-retry
        autoRetryTimeoutRef.current = setTimeout(() => {
          console.log('[useAudioCapture] Auto-retrying after error');
          refreshInProgressRef.current = false;
          getAudioDevicesWrapper();
        }, 2000);
      } else {
        // We've reached max retries, show error
        toast.error("Failed to detect microphones", {
          description: error instanceof Error ? error.message : "Unknown error",
          id: "device-error-max-retries"
        });
        
        // Reset retry counter for next manual attempt
        currentRetryAttemptRef.current = 0;
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
