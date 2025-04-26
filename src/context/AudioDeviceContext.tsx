import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AudioDevice, PermissionState } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

interface AudioDeviceContextType {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
  permissionState: PermissionState;
  isLoading: boolean;
  refreshDevices: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

const AudioDeviceContext = createContext<AudioDeviceContextType | null>(null);

export function useAudioDevices() {
  const context = useContext(AudioDeviceContext);
  if (!context) {
    throw new Error("useAudioDevices must be used within an AudioDeviceProvider");
  }
  return context;
}

interface AudioDeviceProviderProps {
  children: ReactNode;
}

export function AudioDeviceProvider({ children }: AudioDeviceProviderProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const [isDashboard, setIsDashboard] = useState(false);

  // Improved check for restricted routes - dashboard/index/app paths
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);

  // Check if we're on the dashboard page
  useEffect(() => {
    const checkIfDashboard = () => {
      const restricted = isRestrictedRoute();
      setIsDashboard(restricted);
      console.log("[AudioDeviceContext] Route check:", {
        path: window.location.pathname,
        isRestricted: restricted
      });
    };
    
    checkIfDashboard();
    
    // Listen for route changes (simple approach that works without router access)
    const handleRouteChange = () => {
      checkIfDashboard();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isRestrictedRoute]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log("[AudioDeviceContext] Placeholder permission request");
    return false;
  }, []);

  // Format devices from MediaDeviceInfo to our AudioDevice type
  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter(device => device.kind === "audioinput")
      .map((device, index) => {
        // If this is the first device or has "default" ID, mark as default
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

  // Refresh the list of audio devices
  const refreshDevices = useCallback(async (): Promise<void> => {
    console.log("[AudioDeviceContext] Placeholder device refresh");
  }, []);

  // Listen for device changes
  useEffect(() => {
    console.log("[AudioDeviceContext] Placeholder device initialization");
  }, []);

  // Check permission status on mount
  useEffect(() => {
    console.log("[AudioDeviceContext] Placeholder permission check");
  }, []);

  // Custom set selected device function to handle toasts
  const handleSetSelectedDevice = useCallback((deviceId: string) => {
    console.log('[AudioDeviceContext] Setting selected device:', deviceId);
    setSelectedDeviceId(deviceId);
  }, []);

  const value = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId: handleSetSelectedDevice,
    permissionState,
    isLoading,
    refreshDevices,
    requestPermission
  };

  return (
    <AudioDeviceContext.Provider value={value}>
      {children}
    </AudioDeviceContext.Provider>
  );
}
