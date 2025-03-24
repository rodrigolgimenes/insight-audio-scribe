
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
  
  // Special check for simple-record page
  const isSimpleRecordPage = useCallback(() => {
    return window.location.pathname.includes('simple-record');
  }, []);
  
  // Create a wrapper for setSelectedDeviceId that adds verification
  const setSelectedDeviceId = useCallback((deviceId: string | null) => {
    console.log("[DeviceManagerContext] Setting selected device ID:", deviceId);
    
    // For simple-record page, never allow null deviceId
    if ((deviceId === null && devices.length > 0) || (deviceId === null && isSimpleRecordPage())) {
      console.log("[DeviceManagerContext] Prevented setting null deviceId, using first device or default");
      if (devices.length > 0) {
        setRobustSelectedDeviceId(devices[0].deviceId);
      } else {
        setRobustSelectedDeviceId("default-suppressed-device");
      }
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
  }, [devices, selectedDeviceId, setRobustSelectedDeviceId, isSimpleRecordPage]);
  
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
    } else if (isSimpleRecordPage() && !selectedDeviceId) {
      // For simple-record page, always select a default device if none selected
      console.log("[DeviceManagerContext] Simple-record page: setting default device");
      setRobustSelectedDeviceId("default-suppressed-device");
    }
  }, [devices, selectedDeviceId, setRobustSelectedDeviceId, isSimpleRecordPage]);
  
  // Log current state for debugging
  useEffect(() => {
    console.log("[DeviceManagerContext] Current state:", {
      deviceCount: devices.length,
      selectedDeviceId,
      permissionState,
      isLoading,
      isSimpleRecordPage: isSimpleRecordPage()
    });
  }, [devices.length, selectedDeviceId, permissionState, isLoading, isSimpleRecordPage]);

  // Get effective devices, ensuring we never return empty list for simple-record
  const effectiveDevices = useCallback(() => {
    if (devices.length === 0 && isSimpleRecordPage()) {
      return [{
        deviceId: "default-suppressed-device",
        groupId: "default-group",
        label: "Default Microphone",
        kind: "audioinput",
        isDefault: true,
        index: 0
      }];
    }
    return devices;
  }, [devices, isSimpleRecordPage]);

  return (
    <DeviceManagerContext.Provider
      value={{
        devices: effectiveDevices(),
        selectedDeviceId: isSimpleRecordPage() && !selectedDeviceId ? "default-suppressed-device" : selectedDeviceId,
        setSelectedDeviceId,
        isLoading,
        permissionState: isSimpleRecordPage() ? 'granted' : permissionState, 
        refreshDevices
      }}
    >
      {children}
    </DeviceManagerContext.Provider>
  );
};
