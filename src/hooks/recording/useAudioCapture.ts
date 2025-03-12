
import { useState, useCallback } from "react";
import { useMicrophoneAccess } from "./capture/useMicrophoneAccess";
import { usePermissions } from "./capture/usePermissions";
import { useDeviceEnumeration } from "./capture/useDeviceEnumeration";
import { AudioDevice } from "./capture/types";

/**
 * Hook for accessing and managing audio devices
 */
export const useAudioCapture = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);
  
  // Initialize permissions hook
  const { checkPermissions } = usePermissions();
  
  // Initialize device enumeration hook
  const { getAudioDevices } = useDeviceEnumeration(checkPermissions);
  
  // Initialize microphone access hook
  const { requestMicrophoneAccess } = useMicrophoneAccess(
    checkPermissions,
    async (micStream) => {
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
  
  // Get audio devices
  const getAudioDevicesWrapper = useCallback(async () => {
    try {
      console.log('[useAudioCapture] Enumerating audio devices');
      
      const { devices, defaultId } = await getAudioDevices();
      
      console.log('[useAudioCapture] Found audio devices:', devices.length);
      console.log('[useAudioCapture] Default device ID:', defaultId);
      
      setAudioDevices(devices);
      setDefaultDeviceId(defaultId);
      
      return devices;
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      return [];
    }
  }, [getAudioDevices]);
  
  return {
    audioDevices,
    defaultDeviceId,
    getAudioDevices: getAudioDevicesWrapper,
    requestMicrophoneAccess,
    checkPermissions
  };
};
