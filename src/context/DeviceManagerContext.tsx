
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { isRestrictedRoute } from "@/utils/route/isRestrictedRoute";

type PermissionState = "prompt" | "granted" | "denied" | "unknown";

interface DeviceManagerContextValue {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
  permissionState: PermissionState;
  isLoading: boolean;
  refreshDevices: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

interface DeviceManagerProviderProps {
  children: React.ReactNode;
}

const DeviceManagerContext = createContext<DeviceManagerContextValue | null>(null);

export function DeviceManagerProvider({ children }: DeviceManagerProviderProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(false);

  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter(device => device.kind === "audioinput")
      .map((device, index) => {
        const isDefault = device.deviceId === "default" || index === 0;
        return {
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
          groupId: device.groupId,
          kind: device.kind,
          isDefault,
          index
        };
      });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      if (!mountedRef.current) return false;
      
      setPermissionState("granted");
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Permission denied:", error);
      
      if (!mountedRef.current) return false;
      
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setPermissionState("denied");
      }
      
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    if (detectionInProgressRef.current) {
      console.log("[DeviceManagerContext] Device refresh already in progress");
      return;
    }
    
    detectionInProgressRef.current = true;
    setIsLoading(true);
    
    try {
      const permResult = await navigator.permissions.query({ name: "microphone" as PermissionName });
      console.log("[DeviceManagerContext] Permission status:", permResult.state);
      
      if (permResult.state === "denied") {
        setPermissionState("denied");
        return;
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === "audioinput");
      const formattedDevices = formatDevices(audioInputs);

      console.log(`[DeviceManagerContext] Found ${formattedDevices.length} audio inputs`);
      
      if (!mountedRef.current) return;
      
      setDevices(formattedDevices);

      if (!selectedDeviceId && formattedDevices.length > 0) {
        setSelectedDeviceId(formattedDevices[0].deviceId);
      }
    } catch (error) {
      console.error("[DeviceManagerContext] Error in refreshDevices:", error);
      if (mountedRef.current) {
        setDevices([]);
        setPermissionState("unknown");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        detectionInProgressRef.current = false;
      }
    }
  }, [selectedDeviceId, formatDevices]);

  useEffect(() => {
    console.log("[DeviceManagerContext] Initial device refresh");
    refreshDevices();
    
    return () => {
      mountedRef.current = false;
    };
  }, [refreshDevices]);

  const value = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    permissionState,
    isLoading,
    refreshDevices,
    requestPermission
  };

  return (
    <DeviceManagerContext.Provider value={value}>
      {children}
    </DeviceManagerContext.Provider>
  );
}

export function useDeviceManager() {
  const ctx = useContext(DeviceManagerContext);
  if (!ctx) {
    throw new Error("useDeviceManager must be used within a DeviceManagerProvider");
  }
  return ctx;
}
