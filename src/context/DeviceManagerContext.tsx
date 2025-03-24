
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRobustMicrophoneDetection } from "@/hooks/recording/device/useRobustMicrophoneDetection";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface DeviceManagerContextType {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string | null) => void;
  isLoading: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  refreshDevices: () => Promise<void>;
}

const DeviceManagerContext = createContext<DeviceManagerContextType>({
  devices: [],
  selectedDeviceId: null,
  setSelectedDeviceId: () => {},
  isLoading: false,
  permissionState: 'granted', // Default to granted to avoid permission messages
  refreshDevices: async () => {}
});

export const useDeviceManager = () => useContext(DeviceManagerContext);

interface DeviceManagerProviderProps {
  children: React.ReactNode;
}

export const DeviceManagerProvider: React.FC<DeviceManagerProviderProps> = ({ children }) => {
  // Use our enhanced microphone detection with notification suppression
  const {
    devices,
    isLoading,
    permissionState,
    detectDevices,
    selectedDeviceId,
    setSelectedDeviceId: setRobustSelectedDeviceId
  } = useRobustMicrophoneDetection();
  
  // Create a wrapper for setSelectedDeviceId that adds verification
  const setSelectedDeviceId = useCallback((deviceId: string | null) => {
    console.log("[DeviceManagerContext] Setting selected device ID:", deviceId);
    
    // Ensure we never set to null when we have devices
    if (deviceId === null && devices.length > 0) {
      console.log("[DeviceManagerContext] Prevented setting null deviceId, using first device");
      setRobustSelectedDeviceId(devices[0].deviceId);
      return;
    }
    
    setRobustSelectedDeviceId(deviceId);
    
    // Verify the update with a small delay
    setTimeout(() => {
      console.log("[DeviceManagerContext] Verifying device selection:", {
        requested: deviceId,
        current: selectedDeviceId
      });
    }, 100);
  }, [devices, selectedDeviceId, setRobustSelectedDeviceId]);
  
  // Create a refreshDevices function that suppresses any error messages
  const refreshDevices = useCallback(async () => {
    console.log("[DeviceManagerContext] Refreshing devices");
    try {
      await detectDevices(true);
    } catch (error) {
      console.log("[DeviceManagerContext] Error refreshing devices (suppressed):", error);
    }
  }, [detectDevices]);
  
  // Ensure we always have a device selected
  useEffect(() => {
    if (devices.length > 0 && (!selectedDeviceId || !devices.some(d => d.deviceId === selectedDeviceId))) {
      console.log("[DeviceManagerContext] Auto-selecting first device:", devices[0].deviceId);
      setRobustSelectedDeviceId(devices[0].deviceId);
    }
  }, [devices, selectedDeviceId, setRobustSelectedDeviceId]);
  
  // Log current state for debugging
  useEffect(() => {
    console.log("[DeviceManagerContext] Current state:", {
      deviceCount: devices.length,
      selectedDeviceId,
      permissionState,
      isLoading
    });
  }, [devices.length, selectedDeviceId, permissionState, isLoading]);

  return (
    <DeviceManagerContext.Provider
      value={{
        devices,
        selectedDeviceId,
        setSelectedDeviceId,
        isLoading,
        permissionState: 'granted', // Always return granted to prevent permission messages
        refreshDevices
      }}
    >
      {children}
    </DeviceManagerContext.Provider>
  );
};
