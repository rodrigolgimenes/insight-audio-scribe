
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
  
  // Get audio devices
  const getAudioDevicesWrapper = useCallback(async (): Promise<{ devices: AudioDevice[], defaultId: string | null }> => {
    try {
      // Prevent multiple simultaneous refreshes
      if (refreshInProgressRef.current) {
        console.log('[useAudioCapture] Refresh already in progress, skipping');
        return { devices: audioDevices, defaultId: defaultDeviceId };
      }
      
      refreshInProgressRef.current = true;
      console.log('[useAudioCapture] Enumerating audio devices');
      
      // Check if it's been less than 5 seconds since the last refresh
      const now = Date.now();
      if (now - lastRefreshTime < 5000 && audioDevices.length > 0) {
        console.log('[useAudioCapture] Using cached devices from recent refresh');
        refreshInProgressRef.current = false;
        return { devices: audioDevices, defaultId: defaultDeviceId };
      }
      
      setLastRefreshTime(now);
      
      const { devices, defaultId } = await getAudioDevices();
      
      console.log('[useAudioCapture] Found audio devices:', devices.length);
      console.log('[useAudioCapture] Default device ID:', defaultId);
      
      // Only update if we have devices or if we had none before (to avoid flickering)
      if (devices.length > 0 || audioDevices.length === 0) {
        setAudioDevices(devices);
        setDefaultDeviceId(defaultId);
      }
      
      refreshInProgressRef.current = false;
      return { devices, defaultId };
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      refreshInProgressRef.current = false;
      return { devices: [] as AudioDevice[], defaultId: null };
    }
  }, [getAudioDevices, audioDevices, defaultDeviceId, lastRefreshTime]);
  
  // Initial device enumeration - only once at mount
  useEffect(() => {
    getAudioDevicesWrapper();
  }, []);
  
  return {
    audioDevices,
    defaultDeviceId,
    getAudioDevices: getAudioDevicesWrapper,
    requestMicrophoneAccess,
    checkPermissions
  };
};
