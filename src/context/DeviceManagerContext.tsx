
import React, { createContext, useContext, useState, useCallback } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";

type PermissionState = "prompt" | "granted" | "denied" | "unknown";

interface DeviceManagerContextValue {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
  permissionState: PermissionState;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
}

const DeviceManagerContext = createContext<DeviceManagerContextValue | null>(null);

export function DeviceManagerProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState("granted");
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === "audioinput");
      setDevices(audioInputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        groupId: device.groupId,
        kind: device.kind,
        isDefault: device.deviceId === "default" || index === 0,
        index
      })));

      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
      
      return true;
    } catch (error) {
      setPermissionState("denied");
      return false;
    }
  }, [selectedDeviceId]);

  const value = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    permissionState,
    isLoading,
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
