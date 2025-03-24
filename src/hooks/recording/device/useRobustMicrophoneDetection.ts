
import { useState, useEffect, useRef, useCallback } from "react";
import { AudioDevice, toAudioDevice, PermissionState } from "@/hooks/recording/capture/types";

/**
 * Hook for robust microphone detection across different browsers.
 * Modified to suppress all notifications.
 */
export function useRobustMicrophoneDetection() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Refs to track detection and component lifecycle
  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  const hasPermissionsAPI = useRef(!!navigator.permissions);
  const initialLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (initialLoadingTimeoutRef.current) {
      clearTimeout(initialLoadingTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Set a minimum loading time to avoid flashing UI
    initialLoadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 1000);
    
    return cleanup;
  }, [cleanup]);

  // Format devices
  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => {
        const isDefault = device.deviceId === "default" || index === 0;
        return toAudioDevice(device, isDefault, index);
      });
  }, []);

  // Check permission status without showing toasts
  const checkPermissionStatus = useCallback(async (): Promise<PermissionState> => {
    if (!hasPermissionsAPI.current) {
      return "granted"; // Always return granted to avoid showing permission messages
    }
    
    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      
      // Always return granted to avoid permission prompts
      return "granted";
    } catch (err) {
      return "granted"; // Always return granted to avoid permission messages
    }
  }, []);

  // Request microphone access without showing toasts
  const requestMicrophoneAccess = useCallback(async (forceRefresh = false): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      if (!mountedRef.current) return false;

      setPermissionState("granted");
      setTimeout(() => {
        if (mountedRef.current) setIsLoading(false);
      }, 500);
      
      return true;
    } catch (err) {
      if (!mountedRef.current) return false;
      
      // Even on error, pretend permission is granted to avoid showing error messages
      setPermissionState("granted");
      
      setTimeout(() => {
        if (mountedRef.current) setIsLoading(false);
      }, 500);
      
      return false;
    }
  }, []);

  // Detect devices without showing toasts
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{
    devices: AudioDevice[];
    defaultId: string | null;
  }> => {
    if (detectionInProgressRef.current && !forceRefresh) {
      return { devices, defaultId: devices.length > 0 ? devices[0].deviceId : null };
    }
    
    detectionInProgressRef.current = true;
    setIsLoading(true);
    
    if (forceRefresh) {
      setRefreshAttempts(prev => prev + 1);
    }

    try {
      // Always set permission to granted
      setPermissionState("granted");

      // Enumerate devices
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }

      const audioInputDevices = formatDevices(
        mediaDevices.filter((d) => d.kind === "audioinput")
      );
      
      // Determine default device
      let defaultId = null;
      const defaultDevice = audioInputDevices.find(d => d.isDefault);
      
      if (defaultDevice) {
        defaultId = defaultDevice.deviceId;
      } else if (audioInputDevices.length > 0) {
        defaultId = audioInputDevices[0].deviceId;
      }

      setDevices(audioInputDevices);
      
      setTimeout(() => {
        if (mountedRef.current) setIsLoading(false);
      }, 500);
      
      return { devices: audioInputDevices, defaultId };
    } catch (err) {
      if (mountedRef.current) {
        // Even on error, return empty devices without showing errors
        setDevices([]);
        setTimeout(() => {
          if (mountedRef.current) setIsLoading(false);
        }, 500);
      }
      
      return { devices: [], defaultId: null };
    } finally {
      if (mountedRef.current) {
        detectionInProgressRef.current = false;
      }
    }
  }, [formatDevices, devices]);

  // Initial detection and device change listener
  useEffect(() => {
    const handleDeviceChange = () => {
      detectDevices(true).catch(() => {});
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    // Initial device detection
    detectDevices().catch(() => {
      if (mountedRef.current) {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    });

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      cleanup();
    };
  }, [detectDevices, cleanup]);

  return {
    devices,
    isLoading,
    permissionState: "granted" as PermissionState, // Always return granted
    refreshAttempts,
    detectDevices,
    requestMicrophoneAccess,
    selectedDeviceId,
    setSelectedDeviceId
  };
}
