
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

  // Function to enumerate audio devices
  const getAudioDevices = useCallback(async () => {
    // Prevent multiple calls in quick succession
    const now = Date.now();
    if (enumerationInProgressRef.current || (now - lastEnumerationTimeRef.current < 2000 && audioDevices.length > 0)) {
      console.log('[useDeviceEnumeration] Enumeration already in progress or recently completed, returning cached devices');
      return { devices: audioDevices, defaultId: defaultDeviceId };
    }
    
    enumerationInProgressRef.current = true;
    lastEnumerationTimeRef.current = now;
    console.log('[useDeviceEnumeration] Enumerating audio devices');
    
    try {
      // First check if we have permission
      const hasPermission = await checkPermissions();
      
      if (!hasPermission) {
        console.warn('[useDeviceEnumeration] No microphone permission, cannot enumerate devices');
        
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

      // Get a temporary stream to ensure we get labels
      let tempStream: MediaStream | null = null;
      try {
        console.log('[useDeviceEnumeration] Requesting temporary stream to get device labels');
        tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error('[useDeviceEnumeration] Error getting temporary stream:', err);
      }

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter for audio input devices
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      if (audioInputs.length === 0) {
        console.warn('[useDeviceEnumeration] No audio input devices found');
        if (!hasShownToastRef.current) {
          toast.warning("No microphones detected", { 
            description: "Please connect a microphone and try again",
            id: "no-mics-detected" // Use ID to prevent duplicates
          });
          hasShownToastRef.current = true;
        }
        
        // Close temporary stream if it was created
        if (tempStream) {
          tempStream.getTracks().forEach(track => track.stop());
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
        // Usually the first device in the list without a specific deviceId
        const isDefault = index === 0 || device.deviceId === 'default' || device.deviceId === '';
        
        if (isDefault && !foundDefault) {
          foundDefault = true;
          defaultId = device.deviceId;
          console.log('[useDeviceEnumeration] Found default device:', device.deviceId, device.label);
          setDefaultDeviceId(device.deviceId);
        }
        
        // Create our AudioDevice object with a meaningful display name
        return toAudioDevice(device, isDefault, index);
      });
      
      setAudioDevices(convertedDevices);
      
      // If we didn't find a default, use the first device
      if (!foundDefault && convertedDevices.length > 0) {
        defaultId = convertedDevices[0].deviceId;
        console.log('[useDeviceEnumeration] Using first device as default:', convertedDevices[0].deviceId);
        setDefaultDeviceId(convertedDevices[0].deviceId);
      }
      
      // Close the temporary stream if it was created
      if (tempStream) {
        tempStream.getTracks().forEach(track => track.stop());
      }
      
      // Only show the toast once per session and only if actually found devices
      if (!hasShownToastRef.current && convertedDevices.length > 0) {
        toast.success(`Found ${convertedDevices.length} microphone(s)`, {
          description: "You can select a microphone from the dropdown",
          id: "mics-found" // Use ID to prevent duplicates
        });
        hasShownToastRef.current = true;
      }
      
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
      setAudioDevices([]);
      setDefaultDeviceId(null);
      enumerationInProgressRef.current = false;
      devicesFetchedRef.current = false;
      return { devices: [], defaultId: null };
    }
  }, [checkPermissions, audioDevices, defaultDeviceId]);

  // Initial device enumeration
  useEffect(() => {
    getAudioDevices();
    
    // Set up device change listener with debounce
    let deviceChangeTimeout: ReturnType<typeof setTimeout>;
    const handleDeviceChange = () => {
      clearTimeout(deviceChangeTimeout);
      deviceChangeTimeout = setTimeout(() => {
        console.log('[useDeviceEnumeration] Media devices changed, refreshing list');
        // Reset toast flag to allow new toast on device change
        hasShownToastRef.current = false;
        getAudioDevices();
      }, 1000); // 1000ms debounce
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
