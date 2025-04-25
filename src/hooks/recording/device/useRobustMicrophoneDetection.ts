
import { useState, useEffect, useRef, useCallback } from "react";
import { AudioDevice, toAudioDevice, PermissionState } from "@/hooks/recording/capture/types";
import { isRestrictedRoute } from "@/utils/route/isRestrictedRoute";

export function useRobustMicrophoneDetection() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  const hasPermissionsAPI = useRef(!!navigator.permissions);

  const cleanup = useCallback(() => {
    mountedRef.current = false;
  }, []);

  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => {
        const isDefault = device.deviceId === "default" || index === 0;
        return toAudioDevice(device, isDefault, index);
      });
  }, []);

  const checkPermissionStatus = useCallback(async (): Promise<PermissionState> => {
    if (!hasPermissionsAPI.current) {
      console.log("[useRobustMicrophoneDetection] Permissions API not available");
      return "unknown";
    }
    
    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      console.log("[useRobustMicrophoneDetection] Permission status:", result.state);
      return result.state as PermissionState;
    } catch (err) {
      console.error("[useRobustMicrophoneDetection] Error checking permission:", err);
      return "unknown";
    }
  }, []);

  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    console.log("[useRobustMicrophoneDetection] Requesting microphone access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      if (!mountedRef.current) return false;

      setPermissionState("granted");
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("[useRobustMicrophoneDetection] Microphone access denied:", err);
      
      if (!mountedRef.current) return false;
      
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionState("denied");
      }
      
      setIsLoading(false);
      return false;
    }
  }, []);

  const detectDevices = useCallback(async (forceRefresh = false) => {
    if (detectionInProgressRef.current && !forceRefresh) {
      return { devices, defaultId: devices.length > 0 ? devices[0].deviceId : null };
    }
    
    detectionInProgressRef.current = true;
    setIsLoading(true);
    
    if (forceRefresh) {
      setRefreshAttempts(prev => prev + 1);
    }

    try {
      const permStatus = await checkPermissionStatus();
      if (!mountedRef.current) {
        return { devices: [], defaultId: null };
      }
      
      setPermissionState(permStatus);

      if (permStatus !== "granted") {
        const granted = await requestMicrophoneAccess();
        if (!granted || !mountedRef.current) {
          return { devices: [], defaultId: null };
        }
      }

      console.log("[useRobustMicrophoneDetection] Enumerating devices...");
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      
      if (!mountedRef.current) return { devices: [], defaultId: null };

      const audioInputDevices = formatDevices(
        mediaDevices.filter((d) => d.kind === "audioinput")
      );
      
      console.log(`[useRobustMicrophoneDetection] Found ${audioInputDevices.length} audio inputs`);

      let defaultId = null;
      const defaultDevice = audioInputDevices.find(d => d.isDefault);
      defaultId = defaultDevice?.deviceId || (audioInputDevices[0]?.deviceId || null);

      setDevices(audioInputDevices);
      setIsLoading(false);
      
      return { devices: audioInputDevices, defaultId };
    } catch (err) {
      console.error("[useRobustMicrophoneDetection] Error detecting devices:", err);
      setDevices([]);
      setIsLoading(false);
      return { devices: [], defaultId: null };
    } finally {
      detectionInProgressRef.current = false;
    }
  }, [checkPermissionStatus, requestMicrophoneAccess, formatDevices, devices]);

  useEffect(() => {
    const handleDeviceChange = () => {
      console.log("[useRobustMicrophoneDetection] devicechange event detected");
      detectDevices(true).catch(console.error);
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    detectDevices().catch(console.error);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      cleanup();
    };
  }, [detectDevices, cleanup]);

  return {
    devices,
    isLoading,
    permissionState,
    refreshAttempts,
    detectDevices,
    requestMicrophoneAccess
  };
}
