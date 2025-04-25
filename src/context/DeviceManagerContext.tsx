
import React, { createContext, useContext, useState, useCallback } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { PermissionState } from "@/hooks/recording/capture/permissions/types";

interface DeviceManagerContextValue {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
  permissionState: PermissionState;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  refreshDevices: () => Promise<boolean>; // Add this method
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

  // Add the refreshDevices method
  const refreshDevices = useCallback(async (): Promise<boolean> => {
    if (permissionState !== 'granted') {
      return await requestPermission();
    }
    
    try {
      setIsLoading(true);
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
      
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  }, [permissionState, requestPermission]);

  const value = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    permissionState,
    isLoading,
    requestPermission,
    refreshDevices // Include the method in the context value
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
