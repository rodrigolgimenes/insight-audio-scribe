
import React, { ReactNode } from 'react';
import { useDeviceManager } from '@/hooks/device/useDeviceManager';

// Create a context for the device manager
export const DeviceContext = React.createContext<ReturnType<typeof useDeviceManager> | null>(null);

interface DeviceManagerProviderProps {
  children: ReactNode;
}

export function DeviceManagerProvider({ children }: DeviceManagerProviderProps) {
  // Initialize the device manager hook
  const deviceManager = useDeviceManager();
  
  return (
    <DeviceContext.Provider value={deviceManager}>
      {children}
    </DeviceContext.Provider>
  );
}

// Custom hook to use the device manager context
export function useDeviceContext() {
  const context = React.useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within a DeviceManagerProvider');
  }
  return context;
}
