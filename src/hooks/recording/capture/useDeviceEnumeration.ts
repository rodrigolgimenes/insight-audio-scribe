
import { useState, useCallback, useEffect } from "react";
import { AudioDevice, toAudioDevice } from "../capture/types";

type DeviceEnumerationResult = {
  audioDevices: AudioDevice[];
  defaultDeviceId: string | null;
  getAudioDevices: () => Promise<AudioDevice[]>;
};

/**
 * Hook to handle device enumeration with permission checking
 */
export const useDeviceEnumeration = (
  checkPermissions: () => Promise<boolean>
): DeviceEnumerationResult => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);

  // Function to enumerate audio devices
  const getAudioDevices = useCallback(async (): Promise<AudioDevice[]> => {
    console.log('[useDeviceEnumeration] Enumerating audio devices');
    
    try {
      // First check if we have permission
      const hasPermission = await checkPermissions();
      
      if (!hasPermission) {
        console.warn('[useDeviceEnumeration] No microphone permission, cannot enumerate devices');
        setAudioDevices([]);
        setDefaultDeviceId(null);
        return [];
      }

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter for audio input devices
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      if (audioInputs.length === 0) {
        console.warn('[useDeviceEnumeration] No audio input devices found');
        setAudioDevices([]);
        setDefaultDeviceId(null);
        return [];
      }
      
      console.log('[useDeviceEnumeration] Found audio devices:', audioInputs.length);
      
      // Convert to AudioDevice objects
      // Try to determine the default device
      let foundDefault = false;
      
      // Convert to our internal AudioDevice type
      const convertedDevices = audioInputs.map((device, index) => {
        // Check if this is likely the default device
        // Usually the first device in the list without a specific deviceId
        const isDefault = index === 0 || device.deviceId === 'default' || device.deviceId === '';
        
        if (isDefault && !foundDefault) {
          foundDefault = true;
          console.log('[useDeviceEnumeration] Found default device:', device.deviceId, device.label);
          setDefaultDeviceId(device.deviceId);
        }
        
        // Create our AudioDevice object
        return toAudioDevice(device, isDefault);
      });
      
      setAudioDevices(convertedDevices);
      
      // If we didn't find a default, use the first device
      if (!foundDefault && convertedDevices.length > 0) {
        console.log('[useDeviceEnumeration] Using first device as default:', convertedDevices[0].deviceId);
        setDefaultDeviceId(convertedDevices[0].deviceId);
      }
      
      return convertedDevices;
    } catch (error) {
      console.error('[useDeviceEnumeration] Error enumerating devices:', error);
      setAudioDevices([]);
      setDefaultDeviceId(null);
      return [];
    }
  }, [checkPermissions]);

  // Initial device enumeration
  useEffect(() => {
    getAudioDevices();
  }, [getAudioDevices]);

  return {
    audioDevices,
    defaultDeviceId,
    getAudioDevices
  };
};
