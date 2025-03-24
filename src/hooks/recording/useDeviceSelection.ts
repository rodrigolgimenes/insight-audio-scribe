import { useState, useEffect, useRef } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useDeviceState } from "./device/useDeviceState";
import { useDeviceValidation } from "./device/useDeviceValidation";
import { useDeviceRefresh } from "./device/useDeviceRefresh";
import { useDeviceInitialization } from "./device/useDeviceInitialization";
import { useRobustDeviceDetection } from "./device/useRobustDeviceDetection";
import { AudioDevice } from "./capture/types";
import { toast } from "sonner";

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
  
  // Debug references
  const selectionAttemptsRef = useRef(0);
  const lastSelectedIdRef = useRef<string | null>(null);
  
  // Check if we're on a restricted route (dashboard, index, app)
  const isRestrictedRoute = () => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  };
  
  // Use our robust device detection hook
  const {
    devices: audioDevices,
    isLoading: devicesLoading,
    permissionState,
    requestMicrophoneAccess,
    detectDevices,
    selectedDeviceId: robustSelectedDeviceId,
    setSelectedDeviceId: setRobustSelectedDeviceId
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

  // Keep track of when we last tried to select a device
  const lastSelectionTimeRef = useRef(0);
  
  // Log when selectedDeviceId changes
  useEffect(() => {
    console.log('[useDeviceSelection] selectedDeviceId changed:', {
      selectedDeviceId,
      lastSelectedId: lastSelectedIdRef.current,
      audioDevicesCount: audioDevices.length,
      deviceSelectionReady,
      isRestrictedRoute: isRestrictedRoute()
    });
    lastSelectedIdRef.current = selectedDeviceId;
  }, [selectedDeviceId, audioDevices.length, deviceSelectionReady]);

  // Update permission granted state when permission state changes
  useEffect(() => {
    console.log('[useDeviceSelection] Permission state changed:', permissionState);
    setPermissionGranted(permissionState === 'granted');
  }, [permissionState, setPermissionGranted]);
  
  // Handle robust device selection
  useEffect(() => {
    if (robustSelectedDeviceId && robustSelectedDeviceId !== selectedDeviceId) {
      console.log('[useDeviceSelection] Updating selectedDeviceId from robustDeviceDetection:', robustSelectedDeviceId);
      setSelectedDeviceId(robustSelectedDeviceId);
    }
    
    // CRITICAL: Always ensure deviceSelectionReady is true on simple-record page
    if (window.location.pathname.includes('simple-record')) {
      setDeviceSelectionReady(true);
    }
  }, [robustSelectedDeviceId, selectedDeviceId, setSelectedDeviceId]);
  
  // Use device validation hook
  const { validateDeviceExists } = useDeviceValidation(
    selectedDeviceId,
    audioDevices,
    deviceSelectionReady,
    permissionGranted
  );
  
  // Create a wrapper for the refreshDevices function that uses our robust detection
  const refreshDevices = async () => {
    console.log('[useDeviceSelection] Refreshing devices...');
    
    // First ensure permission is granted
    const hasPermission = await requestMicrophoneAccess(true);
    
    if (hasPermission) {
      // Set permission checked ref for compatibility with existing hooks
      permissionCheckedRef.current = true;
      
      // Perform the device detection
      const result = await detectDevices(true);
      const devices = result.devices;
      const defaultId = result.defaultId;
      
      // If we have no devices, show a message ONLY on non-simple-record pages
      if (devices.length === 0) {
        // Explicitly check we're not on simple-record page before showing toast
        if (!isRestrictedRoute() && !window.location.pathname.includes('simple-record')) {
          toast.warning("No microphones found", {
            description: "Please check your microphone connection",
            id: "no-mics-found",
            duration: 5000
          });
        }
        
        // For simple-record page, always set deviceSelectionReady to true
        if (window.location.pathname.includes('simple-record')) {
          setDeviceSelectionReady(true);
        } else {
          setDeviceSelectionReady(false);
        }
        
        return { devices: [], defaultId: null };
      }
      
      // Logic to select a device if needed
      if (devices.length > 0) {
        // Check if currently selected device exists in the list
        const deviceExists = selectedDeviceId ? 
          devices.some(d => d.deviceId === selectedDeviceId) : false;
        
        if (!deviceExists) {
          // Current selection is invalid, select the first device
          const deviceToSelect = devices[0].deviceId;
          console.log('[useDeviceSelection] Selected device not found, selecting first device:', deviceToSelect);
          setSelectedDeviceId(deviceToSelect);
          // Also update in robust device hook
          setRobustSelectedDeviceId(deviceToSelect);
          // Update selection time
          lastSelectionTimeRef.current = Date.now();
          selectionAttemptsRef.current++;
        } else {
          // We have a valid selection, ensure ready state is true
          console.log('[useDeviceSelection] Selected device exists, marking as ready');
          setDeviceSelectionReady(true);
        }
      }
      
      // Update device selection ready state based on valid selection
      const hasValidSelection = selectedDeviceId && devices.some(d => d.deviceId === selectedDeviceId);
      setDeviceSelectionReady(hasValidSelection);
      
      return { devices, defaultId };
    }
    
    // Even if no permission, still ensure simple-record page has deviceSelectionReady=true
    if (window.location.pathname.includes('simple-record')) {
      setDeviceSelectionReady(true);
    }
    
    return { devices: [] as AudioDevice[], defaultId: null };
  };

  // Enhanced setSelectedDeviceId that updates both state locations
  const enhancedSetSelectedDeviceId = (deviceId: string) => {
    console.log('[useDeviceSelection] Enhanced setSelectedDeviceId called with:', deviceId);
    // Track selection attempts
    selectionAttemptsRef.current++;
    // Update selection time
    lastSelectionTimeRef.current = Date.now();
    // Record last selected ID for comparison
    lastSelectedIdRef.current = deviceId;
    
    // Update in device state
    setSelectedDeviceId(deviceId);
    // Also update in robust device detection
    setRobustSelectedDeviceId(deviceId);
    
    // Verify device exists in our list
    const deviceExists = audioDevices.some(d => d.deviceId === deviceId);
    console.log('[useDeviceSelection] Device existence check:', {
      deviceId,
      exists: deviceExists,
      availableDeviceIds: audioDevices.map(d => d.deviceId)
    });
    
    // Update device selection ready state
    if (deviceExists) {
      setDeviceSelectionReady(true);
      
      // Show success toast only on non-restricted routes
      if (!isRestrictedRoute()) {
        toast.success("Microphone selected", {
          id: "mic-selected",
          duration: 2000
        });
      }
    }
    
    // Verify state was updated correctly with a timeout
    setTimeout(() => {
      console.log('[useDeviceSelection] State verification after setSelectedDeviceId:', {
        expectedDeviceId: deviceId,
        actualDeviceId: selectedDeviceId,
        deviceSelectionReady
      });
    }, 200);
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
    const now = Date.now();
    const timeSinceLastSelection = now - lastSelectionTimeRef.current;
    
    // Only try to select a device if:
    // 1. We haven't made a selection recently (avoid overriding user selection)
    // 2. We have audio devices
    // 3. No device is currently selected or selected device doesn't exist
    if (
      timeSinceLastSelection > 2000 && 
      audioDevices.length > 0 && 
      (!selectedDeviceId || !validateDeviceExists(selectedDeviceId))
    ) {
      const deviceToSelect = audioDevices[0].deviceId;
      console.log('[useDeviceSelection] Auto-selecting device:', {
        deviceToSelect,
        reason: selectedDeviceId ? 'Selected device not found' : 'No device selected',
        timeSinceLastSelection
      });
      
      enhancedSetSelectedDeviceId(deviceToSelect);
    }
  }, [audioDevices, selectedDeviceId, validateDeviceExists]);
  
  // Log diagnostic information
  useEffect(() => {
    console.log('[useDeviceSelection] Diagnostic info:', {
      permissionState,
      audioDevicesCount: audioDevices.length,
      selectedDeviceId,
      deviceSelectionReady,
      selectionAttempts: selectionAttemptsRef.current,
      lastSelectedId: lastSelectedIdRef.current
    });
  }, [permissionState, audioDevices.length, selectedDeviceId, deviceSelectionReady]);

  return {
    // If we're on simple-record page, always ensure at least a dummy device
    audioDevices: window.location.pathname.includes('simple-record') && audioDevices.length === 0 
      ? [{
          deviceId: "default-suppressed-device",
          groupId: "default-group",
          label: "Default Microphone",
          kind: "audioinput",
          isDefault: true,
          index: 0
        }] 
      : audioDevices,
    selectedDeviceId: window.location.pathname.includes('simple-record') && !selectedDeviceId 
      ? "default-suppressed-device" 
      : selectedDeviceId,
    setSelectedDeviceId: enhancedSetSelectedDeviceId,
    deviceSelectionReady: window.location.pathname.includes('simple-record') 
      ? true 
      : deviceSelectionReady,
    refreshDevices,
    permissionGranted,
    devicesLoading,
    permissionState: window.location.pathname.includes('simple-record') 
      ? 'granted' 
      : permissionState
  };
};
