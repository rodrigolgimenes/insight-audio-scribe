
import { useState, useCallback, useEffect, useRef } from "react";
import { AudioDevice, toAudioDevice } from "../capture/types";
import { toast } from "sonner";

/**
 * Hook to handle device enumeration with permission checking
 */
export const useDeviceEnumeration = (
  checkPermissions: () => Promise<boolean>
) => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);
  const hasShownToastRef = useRef(false);
  const enumerationInProgressRef = useRef(false);
  const lastEnumerationTimeRef = useRef(0);
  const devicesFetchedRef = useRef(false);
  const attemptCountRef = useRef(0);
  const maxAttempts = 5; // Aumentado o número máximo de tentativas

  // Function to enumerate audio devices with improved error handling
  const getAudioDevices = useCallback(async () => {
    // Prevent multiple calls in quick succession
    const now = Date.now();
    if (enumerationInProgressRef.current) {
      console.log('[useDeviceEnumeration] Enumeration already in progress, returning cached devices');
      return { devices: audioDevices, defaultId: defaultDeviceId };
    }
    
    enumerationInProgressRef.current = true;
    lastEnumerationTimeRef.current = now;
    console.log('[useDeviceEnumeration] Enumerating audio devices (attempt #' + (++attemptCountRef.current) + ')');
    
    try {
      // First check if we have permission
      const hasPermission = await checkPermissions();
      
      if (!hasPermission) {
        console.warn('[useDeviceEnumeration] No microphone permission, cannot enumerate devices');
        
        // Only show toast once
        if (!hasShownToastRef.current) {
          toast.error("Microphone permission required", {
            description: "Please allow microphone access to view available devices",
            id: "mic-permission-required" // Use ID to prevent duplicates
          });
          hasShownToastRef.current = true;
        }
        
        setAudioDevices([]);
        setDefaultDeviceId(null);
        enumerationInProgressRef.current = false;
        devicesFetchedRef.current = false;
        return { devices: [], defaultId: null };
      }

      // We now have permission, let's get the devices in a more reliable way
      
      // Instead of creating a temporary stream first, try direct enumeration
      console.log('[useDeviceEnumeration] Calling enumerateDevices() directly first');
      let devices = await navigator.mediaDevices.enumerateDevices();
      let audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      // If we don't have labels, create a temporary stream to get them
      const needsLabels = audioInputs.some(device => !device.label);
      let tempStream: MediaStream | null = null;
      
      if (needsLabels || audioInputs.length === 0) {
        console.log('[useDeviceEnumeration] Need labels or no devices found, requesting temporary stream');
        try {
          // Try multiple audio constraint configurations if needed
          const audioConfigs = [
            { audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false } },
            { audio: { echoCancellation: true, autoGainControl: true, noiseSuppression: true } },
            { audio: true }
          ];
          
          for (const config of audioConfigs) {
            try {
              console.log('[useDeviceEnumeration] Trying audio config:', config);
              tempStream = await navigator.mediaDevices.getUserMedia(config);
              console.log('[useDeviceEnumeration] Successfully got temporary stream');
              break; // Break the loop if successful
            } catch (err) {
              console.warn(`[useDeviceEnumeration] Failed with config ${JSON.stringify(config)}:`, err);
              // Continue to next config
            }
          }
          
          if (!tempStream) {
            throw new Error('All audio configurations failed');
          }
          
          // Re-enumerate devices after getting the stream to get labels
          await new Promise(resolve => setTimeout(resolve, 500)); // Give browser time to update
          devices = await navigator.mediaDevices.enumerateDevices();
          audioInputs = devices.filter(device => device.kind === 'audioinput');
          
          console.log('[useDeviceEnumeration] After getting stream, found devices:', audioInputs.length);
        } catch (err) {
          console.error('[useDeviceEnumeration] Error getting temporary stream:', err);
          // Continue anyway, we might still have devices without labels
        }
      }
      
      if (audioInputs.length === 0) {
        console.warn('[useDeviceEnumeration] No audio input devices found in enumeration results');
        
        // Show toast only once
        if (!hasShownToastRef.current) {
          toast.warning("No microphones detected", { 
            description: "Please check if your microphone is connected properly",
            id: "no-mics-detected" // Use ID to prevent duplicates
          });
          hasShownToastRef.current = true;
        }
        
        // Close temporary stream if it was created
        if (tempStream) {
          tempStream.getTracks().forEach(track => track.stop());
        }
        
        if (attemptCountRef.current < maxAttempts) {
          // Schedule a retry after a delay
          console.log('[useDeviceEnumeration] Scheduling retry attempt');
          setTimeout(() => {
            enumerationInProgressRef.current = false;
            getAudioDevices();
          }, 1000); // Faster retry
        }
        
        setAudioDevices([]);
        setDefaultDeviceId(null);
        enumerationInProgressRef.current = false;
        devicesFetchedRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      console.log('[useDeviceEnumeration] Found audio devices:', audioInputs.length);
      audioInputs.forEach((device, i) => {
        console.log(`[useDeviceEnumeration] Device ${i}:`, device.deviceId, device.label || 'No label');
      });
      
      // Try to determine the default device
      let foundDefault = false;
      let defaultId = null;
      
      // Convert to our internal AudioDevice type with proper labels
      const convertedDevices = audioInputs.map((device, index) => {
        // Check if this is likely the default device
        const isDefault = device.deviceId === 'default' || device.deviceId === '' || 
                          (index === 0 && !foundDefault);
        
        if (isDefault && !foundDefault) {
          foundDefault = true;
          defaultId = device.deviceId;
          console.log('[useDeviceEnumeration] Found default device:', device.deviceId, device.label);
        }
        
        // Create our AudioDevice object with a meaningful display name
        return toAudioDevice(device, isDefault, index);
      });
      
      // Safely update state variables
      setAudioDevices(convertedDevices);
      
      // If we didn't find a default or the default has an empty ID, use the first device
      if ((!foundDefault || !defaultId) && convertedDevices.length > 0) {
        defaultId = convertedDevices[0].deviceId;
        console.log('[useDeviceEnumeration] Using first device as default:', convertedDevices[0].deviceId);
      }
      
      setDefaultDeviceId(defaultId);
      
      // Close the temporary stream if it was created
      if (tempStream) {
        console.log('[useDeviceEnumeration] Closing temporary stream');
        tempStream.getTracks().forEach(track => track.stop());
      }
      
      // Only show the toast once per session and only if actually found devices
      if (!hasShownToastRef.current && convertedDevices.length > 0) {
        toast.success(`Found ${convertedDevices.length} microphone(s)`, {
          description: "Select a microphone from the dropdown",
          id: "mics-found" // Use ID to prevent duplicates
        });
        hasShownToastRef.current = true;
      }
      
      // Reset attempt counter on success
      attemptCountRef.current = 0;
      
      devicesFetchedRef.current = true;
      enumerationInProgressRef.current = false;
      return { devices: convertedDevices, defaultId };
    } catch (error) {
      console.error('[useDeviceEnumeration] Error enumerating devices:', error);
      
      if (!hasShownToastRef.current) {
        toast.error("Failed to detect microphones", {
          description: error instanceof Error ? error.message : "Unknown error",
          id: "mic-detection-failed" // Use ID to prevent duplicates
        });
        hasShownToastRef.current = true;
      }
      
      // Retry with a different approach after error
      if (attemptCountRef.current < maxAttempts) {
        // Schedule a retry with a different approach
        console.log('[useDeviceEnumeration] Scheduling retry with alternative approach');
        setTimeout(() => {
          enumerationInProgressRef.current = false;
          getAudioDevices();
        }, 1000);
      }
      
      setAudioDevices([]);
      setDefaultDeviceId(null);
      enumerationInProgressRef.current = false;
      devicesFetchedRef.current = false;
      return { devices: [], defaultId: null };
    }
  }, [checkPermissions, audioDevices, defaultDeviceId]);

  // Initial device enumeration
  useEffect(() => {
    console.log('[useDeviceEnumeration] Initial device enumeration');
    getAudioDevices();
    
    // Set up device change listener with debounce
    let deviceChangeTimeout: ReturnType<typeof setTimeout>;
    const handleDeviceChange = () => {
      clearTimeout(deviceChangeTimeout);
      deviceChangeTimeout = setTimeout(() => {
        console.log('[useDeviceEnumeration] Media devices changed, refreshing list');
        // Reset toast flag to allow new toast on device change
        hasShownToastRef.current = false;
        enumerationInProgressRef.current = false;
        getAudioDevices();
      }, 500); // Reduzido para 500ms
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      clearTimeout(deviceChangeTimeout);
    };
  }, [getAudioDevices]);

  return {
    audioDevices,
    defaultDeviceId,
    getAudioDevices,
    devicesFetched: devicesFetchedRef.current
  };
};
