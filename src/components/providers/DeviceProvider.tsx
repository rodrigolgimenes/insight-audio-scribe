
import React, { createContext, useState, useEffect, ReactNode } from "react";

interface DeviceContextType {
  audioDevices: MediaDeviceInfo[];
  initError: Error | null;
  refreshDevices: () => Promise<void>;
  devicesLoading: boolean;
  permissionState: PermissionState;
}

export const DeviceContext = createContext<DeviceContextType>({
  audioDevices: [],
  initError: null,
  refreshDevices: async () => {},
  devicesLoading: false,
  permissionState: 'prompt'
});

interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [initError, setInitError] = useState<Error | null>(null);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');

  const refreshDevices = async () => {
    try {
      setDevicesLoading(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputDevices);
      
      // Check microphone permission
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionState(permissionStatus.state);
      } catch (error) {
        console.warn('Unable to query permission status:', error);
      }
    } catch (error) {
      console.error('Error refreshing devices:', error);
      setInitError(error instanceof Error ? error : new Error('Unknown error refreshing devices'));
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    refreshDevices();
  }, []);

  return (
    <DeviceContext.Provider value={{
      audioDevices,
      initError,
      refreshDevices,
      devicesLoading,
      permissionState
    }}>
      {children}
    </DeviceContext.Provider>
  );
};
