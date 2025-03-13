
import React, { createContext, useState, useEffect } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";

type DeviceContextType = {
  audioDevices: AudioDevice[];
  initError: Error | null;
  refreshDevices: (() => Promise<{ devices: AudioDevice[]; defaultId: string | null }>) | null;
  devicesLoading: boolean;
  permissionState: string | null;
};

// Default context value
const defaultDeviceContext: DeviceContextType = {
  audioDevices: [],
  initError: null,
  refreshDevices: null,
  devicesLoading: false,
  permissionState: null
};

export const DeviceContext = createContext<DeviceContextType>(defaultDeviceContext);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [initError, setInitError] = useState<Error | null>(null);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<string | null>(null);

  // Mock implementation of refreshDevices
  const refreshDevices = async () => {
    setDevicesLoading(true);
    
    try {
      // Implementation would depend on your browser APIs and permissions
      const devices: AudioDevice[] = [];
      const defaultId = null;
      
      setAudioDevices(devices);
      return { devices, defaultId };
    } catch (error) {
      console.error('[DeviceProvider] Error refreshing devices:', error);
      if (error instanceof Error) {
        setInitError(error);
      } else {
        setInitError(new Error('Unknown error refreshing devices'));
      }
      return { devices: [], defaultId: null };
    } finally {
      setDevicesLoading(false);
    }
  };

  // Initialize devices on mount
  useEffect(() => {
    refreshDevices();
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        audioDevices,
        initError,
        refreshDevices,
        devicesLoading,
        permissionState
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};
