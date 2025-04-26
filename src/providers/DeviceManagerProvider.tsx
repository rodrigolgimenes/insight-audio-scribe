
import React, { ReactNode, useEffect } from 'react';
import { useDeviceManager } from '@/hooks/device/useDeviceManager';
import { isRestrictedRoute } from '@/utils/route/isRestrictedRoute';

// Create a context for the device manager
export const DeviceContext = React.createContext<ReturnType<typeof useDeviceManager> | null>(null);

interface DeviceManagerProviderProps {
  children: ReactNode;
}

// Track displayed toast IDs to prevent duplicates
const displayedToastIds = new Set<string>();

export function DeviceManagerProvider({ children }: DeviceManagerProviderProps) {
  // Initialize the device manager hook
  const deviceManager = useDeviceManager();
  
  // Clear toast tracking on route change
  useEffect(() => {
    const handleRouteChange = () => {
      // Only clear toast tracking on navigation
      if (window.location.pathname !== window.history.state?.prevPath) {
        displayedToastIds.clear();
      }
      
      // Create a new history state object instead of modifying the existing one
      const newHistoryState = {
        ...window.history.state,
        prevPath: window.location.pathname
      };
      
      // Replace the current history state with our updated version
      window.history.replaceState(newHistoryState, '');
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    // Initial check on mount - removed toast.info call
    if (deviceManager.devices.length === 0 && !deviceManager.isLoading && !isRestrictedRoute()) {
      deviceManager.refreshDevices(false);
    }
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [deviceManager.devices.length, deviceManager.isLoading]);
  
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
