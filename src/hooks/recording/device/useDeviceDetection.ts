
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

  // Avoid notifications on restricted routes
  const isDashboardPage = useRef(window.location.pathname.includes('/app'));

  // Clean up on unmount
  useEffect(() => {
    isDashboardPage.current = window.location.pathname.includes('/app');
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const detectDevices = useCallback(async (forceRefresh = false): Promise<{devices: AudioDevice[], defaultId: string | null}> => {
    // Don't run detection if it's already in progress and not forced
    if (detectionInProgressRef.current && !forceRefresh) {
      console.log('[useDeviceDetection] Device detection already in progress');
      return { devices, defaultId: null };
    }

    detectionInProgressRef.current = true;
    setIsLoading(true);

    try {
      // Check for permission first
      const hasPermission = await requestPermission(!isDashboardPage.current);
      
      if (!mountedRef.current) {
        return { devices: [], defaultId: null };
      }

      if (!hasPermission) {
        console.warn('[useDeviceDetection] Permission not granted');
        setDevices([]);
        return { devices: [], defaultId: null };
      }

      // Primary device detection
      console.log('[useDeviceDetection] Detecting audio devices');
      const result = await getAudioDevices();

      if (!mountedRef.current) {
        return { devices: [], defaultId: null };
      }

      // If devices found, update state and return
      if (result.devices.length > 0) {
        console.log('[useDeviceDetection] Devices found:', result.devices.length);
        setDevices(result.devices);
        initialCheckDoneRef.current = true;
        return result;
      }
      
      // If no devices found on first try and we haven't completed initial check, try once more
      if (result.devices.length === 0 && !initialCheckDoneRef.current) {
        console.log('[useDeviceDetection] No devices found, attempting one fallback');
        
        // Wait a short moment before retry
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
        
        // If still no devices, update state
        console.log('[useDeviceDetection] Fallback failed, no devices found');
        setDevices([]);
      } else {
        setDevices(result.devices);
      }
      
      initialCheckDoneRef.current = true;
      return { devices: result.devices, defaultId: result.defaultId };

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
