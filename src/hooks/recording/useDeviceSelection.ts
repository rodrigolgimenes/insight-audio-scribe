
import { useState, useEffect } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useDeviceState } from "./device/useDeviceState";
import { useDeviceValidation } from "./device/useDeviceValidation";
import { useDeviceRefresh } from "./device/useDeviceRefresh";
import { useDeviceInitialization } from "./device/useDeviceInitialization";
import { useRobustDeviceDetection } from "./device/useRobustDeviceDetection";

/**
 * Main hook for device selection management
 */
export const useDeviceSelection = () => {
  // Get audio devices and permission utilities from useAudioCapture
  const { 
    getAudioDevices, 
    defaultDeviceId, 
    checkPermissions 
  } = useAudioCapture();
  
  // Use our new robust device detection hook
  const {
    devices: audioDevices,
    isLoading: devicesLoading,
    permissionState,
    requestPermission,
    detectDevices,
  } = useRobustDeviceDetection(getAudioDevices, checkPermissions);

  // Convert permission state to boolean for compatibility
  const permissionGranted = permissionState === 'granted';
  
  // Use the device state hook for core state management
  const {
    selectedDeviceId,
    deviceSelectionReady,
    deviceInitializationAttempted,
    refreshTimeoutRef,
    permissionCheckedRef,
    setSelectedDeviceId,
    setDeviceSelectionReady,
    setPermissionGranted
  } = useDeviceState();

  // Update permission granted state when permission state changes
  useEffect(() => {
    setPermissionGranted(permissionState === 'granted');
  }, [permissionState, setPermissionGranted]);
  
  // Use device validation hook
  const { validateDeviceExists } = useDeviceValidation(
    selectedDeviceId,
    audioDevices,
    deviceSelectionReady,
    permissionGranted
  );
  
  // Create a wrapper for the refreshDevices function that uses our new robust detection
  const refreshDevices = async () => {
    console.log('[useDeviceSelection] Refreshing devices...');
    // First ensure permission is granted
    const hasPermission = await requestPermission();
    
    if (hasPermission) {
      // Set permission checked ref for compatibility with existing hooks
      permissionCheckedRef.current = true;
      
      // Perform the device detection
      const devices = await detectDevices(true);
      
      // Logic to select a device if needed
      if (devices.length > 0) {
        // If we currently have no selection or an invalid selection, select the first device
        if (!selectedDeviceId || !devices.some(d => d.deviceId === selectedDeviceId)) {
          const deviceToSelect = devices[0].deviceId;
          console.log('[useDeviceSelection] Auto-selecting device:', deviceToSelect);
          setSelectedDeviceId(deviceToSelect);
        } else {
          // We have a valid selection, ensure ready state is true
          setDeviceSelectionReady(true);
        }
      } else {
        setDeviceSelectionReady(false);
      }
      
      return devices;
    }
    
    return [];
  };
  
  // Use device initialization hook with our modified refreshDevices function
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
    // 4. The default device exists in our list
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
    permissionGranted,
    devicesLoading,
    permissionState
  };
};
