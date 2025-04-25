
import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";

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

const DeviceManagerContext = createContext<DeviceManagerContextValue | null>(null);

export function DeviceManagerProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const detectionInProgressRef = useRef(false);

  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter(device => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        groupId: device.groupId,
        kind: device.kind,
        isDefault: device.deviceId === "default" || index === 0,
        index
      }));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState("granted");
      return true;
    } catch (error) {
      setPermissionState("denied");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    if (detectionInProgressRef.current) return;
    
    detectionInProgressRef.current = true;
    setIsLoading(true);
    
    try {
      if (permissionState !== "granted") {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;
      }
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === "audioinput");
      const formattedDevices = formatDevices(audioInputs);
      
      setDevices(formattedDevices);

      if (!selectedDeviceId && formattedDevices.length > 0) {
        setSelectedDeviceId(formattedDevices[0].deviceId);
      }
    } catch (error) {
      console.error("[DeviceManagerContext] Error in refreshDevices:", error);
      setDevices([]);
    } finally {
      setIsLoading(false);
      detectionInProgressRef.current = false;
    }
  }, [selectedDeviceId, formatDevices, permissionState, requestPermission]);

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
