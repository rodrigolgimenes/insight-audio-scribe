
import { useEffect } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";

/**
 * Hook for handling initial device setup and changes
 */
export const useDeviceInitialization = (
  refreshDevices: () => Promise<{ devices: AudioDevice[]; defaultId: string | null }>,
  deviceInitializationAttempted: React.MutableRefObject<boolean>,
  audioDevices: AudioDevice[],
  selectedDeviceId: string | null,
  deviceSelectionReady: boolean,
  permissionGranted: boolean,
  setDeviceSelectionReady: (value: boolean) => void
) => {
  // Initialize devices when the component mounts
  useEffect(() => {
    if (!deviceInitializationAttempted.current) {
      deviceInitializationAttempted.current = true;
      console.log('[useDeviceInitialization] Initial device initialization');
      refreshDevices();
    }
  }, [refreshDevices, deviceInitializationAttempted]);

  // Update selection ready state when devices or selection changes
  useEffect(() => {
    // Only run this if we've already attempted initialization
    if (!deviceInitializationAttempted.current) return;
    
    const deviceExists = selectedDeviceId && audioDevices.some(d => d.deviceId === selectedDeviceId);
    const shouldBeReady = audioDevices.length > 0 && !!selectedDeviceId && deviceExists && permissionGranted;
    
    if (shouldBeReady !== deviceSelectionReady) {
      console.log('[useDeviceInitialization] Updating device selection ready state:', shouldBeReady);
      setDeviceSelectionReady(shouldBeReady);
    }
  }, [
    selectedDeviceId, 
    audioDevices, 
    deviceSelectionReady, 
    permissionGranted, 
    deviceInitializationAttempted,
    setDeviceSelectionReady
  ]);

  return {
    isInitialized: deviceInitializationAttempted.current
  };
};
