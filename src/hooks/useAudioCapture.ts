
import { useState, useCallback, useEffect, useRef } from "react";
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
  
  // Track if we've already shown a "no microphones" toast
  const hasShownNoMicToastRef = useRef(false);
  // Track visibility changes
  const lastVisibilityStateRef = useRef(document.visibilityState);
  // Track pending detection operations
  const detectionInProgressRef = useRef(false);
  // Track debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Improved check for restricted routes
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);
  
  // Debounce function
  const debounce = useCallback((fn: Function, delay: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fn();
    }, delay);
  }, []);
  
  // Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentVisibility = document.visibilityState;
      
      console.log('[useAudioCapture] Visibility changed:', {
        from: lastVisibilityStateRef.current,
        to: currentVisibility
      });
      
      lastVisibilityStateRef.current = currentVisibility;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Check if we're on the dashboard or index page
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
      
      // Prevent multiple simultaneous detections
      if (detectionInProgressRef.current) {
        console.log('[useAudioCapture] Detection already in progress');
        return { devices: audioDevices, defaultId: defaultDeviceId };
      }
      
      // Check if it's been less than 5 seconds since the last refresh
      const now = Date.now();
      if (now - lastRefreshTime < 5000 && audioDevices.length > 0) {
        console.log('[useAudioCapture] Using cached devices from recent refresh');
        return { devices: audioDevices, defaultId: defaultDeviceId };
      }
      
      setLastRefreshTime(now);
      detectionInProgressRef.current = true;
      
      const { devices, defaultId } = await getAudioDevices();
      
      console.log('[useAudioCapture] Found audio devices:', devices.length);
      console.log('[useAudioCapture] Default device ID:', defaultId);
      
      // Only show toast if not on a restricted route, page is visible,
      // we haven't shown it before, and we actually have no devices
      if (
        devices.length === 0 && 
        !isRestrictedRoute() && 
        !hasShownNoMicToastRef.current &&
        document.visibilityState === 'visible'
      ) {
        toast.error("No microphones found", {
          description: "Please connect a microphone and try again"
        });
        hasShownNoMicToastRef.current = true;
      }
      
      // Reset the toast shown flag if we now have devices
      if (devices.length > 0) {
        hasShownNoMicToastRef.current = false;
      }
      
      setAudioDevices(devices);
      setDefaultDeviceId(defaultId);
      
      detectionInProgressRef.current = false;
      return { devices, defaultId };
    } catch (error) {
      console.error('[useAudioCapture] Error getting audio devices:', error);
      
      // Only show error toast if not on a restricted route and page is visible
      if (
        !isRestrictedRoute() && 
        !hasShownNoMicToastRef.current &&
        document.visibilityState === 'visible'
      ) {
        toast.error("Failed to detect microphones", {
          description: error instanceof Error ? error.message : "Unknown error"
        });
        hasShownNoMicToastRef.current = true;
      }
      
      detectionInProgressRef.current = false;
      return { devices: [] as AudioDevice[], defaultId: null };
    }
  }, [getAudioDevices, audioDevices, defaultDeviceId, lastRefreshTime, isRestrictedRoute]);
  
  // Initial device enumeration
  useEffect(() => {
    const initialDetection = () => {
      getAudioDevicesWrapper().catch(error => {
        console.error('[useAudioCapture] Initial detection error:', error);
      });
    };
    
    // Debounce the initial detection to avoid race conditions
    debounce(initialDetection, 500);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [getAudioDevicesWrapper, debounce]);
  
  return {
    audioDevices,
    defaultDeviceId,
    getAudioDevices: getAudioDevicesWrapper,
    requestMicrophoneAccess,
    checkPermissions
  };
};
