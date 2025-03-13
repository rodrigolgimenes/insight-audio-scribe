
import { useState, useCallback, useEffect } from "react";
import { useMicrophoneAccess } from "./recording/capture/useMicrophoneAccess";
import { usePermissions } from "./recording/capture/usePermissions";
import { useDeviceEnumeration } from "./recording/capture/useDeviceEnumeration";
import { AudioDevice } from "./recording/capture/types";
import { toast } from "sonner";

/**
 * Hook for accessing and managing audio devices
 */
export const useAudioCapture = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isDashboard, setIsDashboard] = useState(false);
  
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
  
  // Check if we're on a restricted route
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || path === '/index' || path.includes('/app') || path === '/dashboard';
  }, []);
  
  // Check if we're on the dashboard page
  useEffect(() => {
    const checkIfDashboard = () => {
      setIsDashboard(isRestrictedRoute());
    };
    
    checkIfDashboard();
    
    window.addEventListener('popstate', checkIfDashboard);
    
    return () => {
      window.removeEventListener('popstate', checkIfDashboard);
    };
  }, [isRestrictedRoute]);
  
  // Get audio devices
  const getAudioDevicesWrapper = useCallback(async (): Promise<{ devices: AudioDevice[], defaultId: string | null }> => {
    try {
      console.log('[useAudioCapture] Enumerating audio devices');
      
      // Check if it's been less than 5 seconds since the last refresh
      const now = Date.now();
      if (now - lastRefreshTime < 5000 && audioDevices.length > 0) {
        console.log('[useAudioCapture] Using cached devices from recent refresh');
        return { devices: audioDevices, defaultId: defaultDeviceId };
      }
      
      setLastRefreshTime(now);
      
      const { devices, defaultId } = await getAudioDevices();
      
      console.log('[useAudioCapture] Found audio devices:', devices.length);
      console.log('[useAudioCapture] Default device ID:', defaultId);
      
      // Only show toast if not on a restricted route
      if (devices.length === 0 && !isRestrictedRoute()) {
        toast.error("No microphones found", {
          description: "Please connect a microphone and try again"
        });
      }
      
      setAudioDevices(devices);
      setDefaultDeviceId(defaultId);
      
      return { devices, defaultId };
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      
      // Only show error toast if not on a restricted route
      if (!isRestrictedRoute()) {
        toast.error("Failed to detect microphones", {
          description: error instanceof Error ? error.message : "Unknown error"
        });
      }
      
      return { devices: [] as AudioDevice[], defaultId: null };
    }
  }, [getAudioDevices, audioDevices, defaultDeviceId, lastRefreshTime, isRestrictedRoute]);
  
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
