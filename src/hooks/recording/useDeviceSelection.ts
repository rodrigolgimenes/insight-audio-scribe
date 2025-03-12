
import { useState, useEffect } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useDeviceState } from "./device/useDeviceState";
import { useDeviceValidation } from "./device/useDeviceValidation";
import { useDeviceRefresh } from "./device/useDeviceRefresh";
import { useDeviceInitialization } from "./device/useDeviceInitialization";

/**
 * Main hook for device selection management
 */
export const useDeviceSelection = () => {
  // Get audio devices and permission utilities from useAudioCapture
  const { 
    getAudioDevices, 
    audioDevices, 
    defaultDeviceId, 
    checkPermissions 
  } = useAudioCapture();
  
  // Use the device state hook for core state management
  const {
    selectedDeviceId,
    deviceSelectionReady,
    permissionGranted,
    deviceInitializationAttempted,
    refreshTimeoutRef,
    permissionCheckedRef,
    setSelectedDeviceId,
    setDeviceSelectionReady,
    setPermissionGranted
  } = useDeviceState();
  
  // Use device validation hook
  const { validateDeviceExists } = useDeviceValidation(
    selectedDeviceId,
    audioDevices,
    deviceSelectionReady,
    permissionGranted
  );
  
  // Use device refresh hook
  const { refreshDevices } = useDeviceRefresh(
    checkPermissions,
    getAudioDevices,
    setPermissionGranted,
    setDeviceSelectionReady,
    setSelectedDeviceId,
    selectedDeviceId,
    refreshTimeoutRef,
    permissionCheckedRef
  );
  
  // Use device initialization hook
  useDeviceInitialization(
    refreshDevices,
    deviceInitializationAttempted,
    audioDevices,
    selectedDeviceId,
    deviceSelectionReady,
    permissionGranted,
    setDeviceSelectionReady
  );
  
  // Handle case where default device should be selected after initialization
  useEffect(() => {
    // Only try to select the default device if:
    // 1. We have audio devices
    // 2. We have a default device ID
    // 3. No device is currently selected
    if (
      audioDevices.length > 0 && 
      defaultDeviceId && 
      !selectedDeviceId && 
      validateDeviceExists(defaultDeviceId)
    ) {
      console.log('[useDeviceSelection] Auto-selecting default device:', defaultDeviceId);
      setSelectedDeviceId(defaultDeviceId);
    }
  }, [audioDevices, defaultDeviceId, selectedDeviceId, setSelectedDeviceId, validateDeviceExists]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    deviceSelectionReady,
    refreshDevices,
    permissionGranted
  };
};
