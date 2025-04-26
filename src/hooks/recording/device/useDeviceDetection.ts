import { useState, useCallback, useRef, useEffect } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";

export const useDeviceDetection = (
  getAudioDevices: () => Promise<{devices: AudioDevice[], defaultId: string | null}>,
  requestPermission: (showToast: boolean) => Promise<boolean>
) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  const initialCheckDoneRef = useRef(false);

  // Check if we're on a restricted route
  const isDashboardPage = useRef(window.location.pathname.includes('/app'));

  // Clean up on unmount
  useEffect(() => {
    isDashboardPage.current = window.location.pathname.includes('/app');
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const detectDevices = useCallback(async (forceRefresh = false): Promise<{devices: AudioDevice[], defaultId: string | null}> => {
    // Prevent concurrent detection attempts
    if (detectionInProgressRef.current && !forceRefresh) {
      console.log('[useDeviceDetection] Device detection already in progress');
      return { devices, defaultId: null };
    }

    detectionInProgressRef.current = true;
    setIsLoading(true);

    try {
      // Initial permission check
      const hasPermission = await requestPermission(!isDashboardPage.current);
      
      if (!mountedRef.current) {
        return { devices: [], defaultId: null };
      }

      if (!hasPermission) {
        console.warn('[useDeviceDetection] Permission not granted');
        setDevices([]);
        return { devices: [], defaultId: null };
      }

      // Primary device detection attempt
      console.log('[useDeviceDetection] Attempting primary device detection');
      const result = await getAudioDevices();

      if (!mountedRef.current) {
        return { devices: [], defaultId: null };
      }

      // If no devices found on first try, attempt one fallback
      if (result.devices.length === 0 && !initialCheckDoneRef.current) {
        console.log('[useDeviceDetection] No devices found, attempting fallback');
        
        // Wait a moment before fallback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!mountedRef.current) {
          return { devices: [], defaultId: null };
        }

        // One final attempt
        const fallbackResult = await getAudioDevices();
        
        if (fallbackResult.devices.length > 0) {
          console.log('[useDeviceDetection] Fallback succeeded');
          setDevices(fallbackResult.devices);
          initialCheckDoneRef.current = true;
          return fallbackResult;
        }
      } else {
        // Devices found on first try
        setDevices(result.devices);
        initialCheckDoneRef.current = true;
        return result;
      }

      // If we reach here, no devices were found
      setDevices([]);
      initialCheckDoneRef.current = true;
      return { devices: [], defaultId: null };

    } catch (err) {
      console.error('[useDeviceDetection] Error detecting devices:', err);
      setDevices([]);
      return { devices: [], defaultId: null };
    } finally {
      setIsLoading(false);
      detectionInProgressRef.current = false;
    }
  }, [devices, getAudioDevices, requestPermission]);

  return {
    devices,
    isLoading,
    detectDevices,
    cleanup: () => {
      mountedRef.current = false;
    }
  };
};
