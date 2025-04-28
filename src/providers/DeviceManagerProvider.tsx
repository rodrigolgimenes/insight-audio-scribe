
import React, { ReactNode, useEffect } from 'react';
import { useDeviceManager } from '@/hooks/device/useDeviceManager';
import { isRestrictedRoute } from '@/utils/route/isRestrictedRoute';

// Create a context for the device manager
export const DeviceContext = React.createContext<ReturnType<typeof useDeviceManager> | null>(null);

interface DeviceManagerProviderProps {
  children: ReactNode;
}

export function DeviceManagerProvider({ children }: DeviceManagerProviderProps) {
  // Initialize the device manager hook
  const deviceManager = useDeviceManager();
  
  // Combined effect: track route changes and refresh devices on mount if needed
  useEffect(() => {
    const handleRouteChange = () => {
      // Create a new history state object instead of modifying the existing one
      const newHistoryState = {
        ...window.history.state,
        prevPath: window.location.pathname
      };
      
      // Replace the current history state with our updated version
      window.history.replaceState(newHistoryState, '');
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    // Initial check on mount - with no toast notification
    if (deviceManager.devices.length === 0 && !deviceManager.isLoading && !isRestrictedRoute()) {
      console.log('[DeviceManagerProvider] No devices detected, refreshing on mount');
      deviceManager.refreshDevices(false); // Pass false to avoid showing a notification
    }
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [deviceManager.devices.length, deviceManager.isLoading, deviceManager.refreshDevices]);
  
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
