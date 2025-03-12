
import { useState, useCallback, useEffect } from "react";
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
  
  // Initialize permissions hook
  const { checkPermissions } = usePermissions();
  
  // Initialize device enumeration hook
  const { getAudioDevices } = useDeviceEnumeration(checkPermissions);
  
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
  
  // Get audio devices
  const getAudioDevicesWrapper = useCallback(async () => {
    try {
      console.log('[useAudioCapture] Enumerating audio devices');
      
      // Check if it's been less than 5 seconds since the last refresh
      const now = Date.now();
      if (now - lastRefreshTime < 5000 && audioDevices.length > 0) {
        console.log('[useAudioCapture] Using cached devices from recent refresh');
        return audioDevices;
      }
      
      setLastRefreshTime(now);
      
      const { devices, defaultId } = await getAudioDevices();
      
      console.log('[useAudioCapture] Found audio devices:', devices.length);
      console.log('[useAudioCapture] Default device ID:', defaultId);
      
      setAudioDevices(devices);
      setDefaultDeviceId(defaultId);
      
      if (devices.length === 0) {
        toast.error("No microphones found", {
          description: "Please connect a microphone and try again"
        });
      } else {
        toast.success(`Found ${devices.length} microphone(s)`, {
          description: "Select a microphone to start recording"
        });
      }
      
      return devices;
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      toast.error("Failed to detect microphones", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      return [];
    }
  }, [getAudioDevices, audioDevices, lastRefreshTime]);
  
  // Initial device enumeration
  useEffect(() => {
    getAudioDevicesWrapper();
  }, [getAudioDevicesWrapper]);
  
  return {
    audioDevices,
    defaultDeviceId,
    getAudioDevices: getAudioDevicesWrapper,
    requestMicrophoneAccess,
    checkPermissions
  };
};
