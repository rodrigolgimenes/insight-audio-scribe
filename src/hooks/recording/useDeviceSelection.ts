
import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { toast } from "sonner";
import { RecordingValidator } from "@/utils/audio/recordingValidator";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const { 
    getAudioDevices, 
    audioDevices, 
    defaultDeviceId, 
    requestMicrophoneAccess, 
    checkPermissions 
  } = useAudioCapture();
  
  const deviceInitializationAttempted = useRef(false);
  const selectionInProgressRef = useRef(false);
  const lastSelectedDeviceRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const permissionCheckedRef = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleDeviceSelect = useCallback((deviceId: string) => {
    // Validate the device ID
    if (!deviceId || deviceId === '') {
      console.warn('[useDeviceSelection] Attempted to select invalid device ID:', deviceId);
      return;
    }
    
    console.log('[useDeviceSelection] Setting device ID:', deviceId);
    
    // Check if the device exists in our list
    const deviceExists = audioDevices.some(device => device.deviceId === deviceId);
    if (!deviceExists) {
      console.warn('[useDeviceSelection] Selected device not found in device list:', deviceId);
      // Still set it since it might be valid (list might not be updated yet)
    }
    
    setSelectedDeviceId(deviceId);
    lastSelectedDeviceRef.current = deviceId;
    setDeviceSelectionReady(true);
    
    console.log('[useDeviceSelection] Device selected successfully:', deviceId);
    
    // Log diagnostics
    RecordingValidator.logDiagnostics({
      selectedDeviceId: deviceId,
      deviceSelectionReady: true,
      audioDevices,
      isRecording: false,
      permissionsGranted: permissionGranted
    });
  }, [audioDevices, permissionGranted]);

  // Check permissions and refresh devices
  const refreshDevices = useCallback(async () => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    console.log('[useDeviceSelection] Refreshing devices manually');
    
    try {
      // First check permissions
      const hasPermission = await checkPermissions();
      setPermissionGranted(hasPermission);
      permissionCheckedRef.current = true;
      
      if (!hasPermission) {
        console.warn('[useDeviceSelection] No microphone permission during refresh');
        setDeviceSelectionReady(false);
        return;
      }
      
      const devices = await getAudioDevices();
      console.log('[useDeviceSelection] Device refresh resulted in:', devices.length, 'devices');
      
      // If we have devices but no selection, select one
      if (devices.length > 0) {
        if (!selectedDeviceId || !devices.some(d => d.deviceId === selectedDeviceId)) {
          // Prefer the default device or the first available
          const deviceToSelect = defaultDeviceId && devices.some(d => d.deviceId === defaultDeviceId) 
            ? defaultDeviceId 
            : devices[0].deviceId;
            
          if (deviceToSelect) {
            handleDeviceSelect(deviceToSelect);
          }
        } else {
          // We already have a valid selection, ensure ready state is true
          setDeviceSelectionReady(true);
        }
      } else {
        setDeviceSelectionReady(false);
      }
    } catch (error) {
      console.error('[useDeviceSelection] Error refreshing devices:', error);
      setDeviceSelectionReady(false);
    }
  }, [getAudioDevices, defaultDeviceId, selectedDeviceId, handleDeviceSelect, checkPermissions]);

  // Initialize devices when the component mounts
  useEffect(() => {
    if (!deviceInitializationAttempted.current) {
      deviceInitializationAttempted.current = true;
      console.log('[useDeviceSelection] Initial device initialization');
      refreshDevices();
    }
  }, [refreshDevices]);

  // Update selection ready state when devices or selection changes
  useEffect(() => {
    // Only run this if we've already attempted initialization
    if (!deviceInitializationAttempted.current) return;
    
    const deviceExists = selectedDeviceId && audioDevices.some(d => d.deviceId === selectedDeviceId);
    const shouldBeReady = audioDevices.length > 0 && !!selectedDeviceId && deviceExists && permissionGranted;
    
    if (shouldBeReady !== deviceSelectionReady) {
      console.log('[useDeviceSelection] Updating device selection ready state:', shouldBeReady);
      setDeviceSelectionReady(shouldBeReady);
    }
    
    // Log diagnostics on state changes
    RecordingValidator.logDiagnostics({
      selectedDeviceId,
      deviceSelectionReady: shouldBeReady,
      audioDevices,
      isRecording: false,
      permissionsGranted: permissionGranted
    });
  }, [selectedDeviceId, audioDevices, deviceSelectionReady, permissionGranted]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId: handleDeviceSelect,
    deviceSelectionReady,
    refreshDevices,
    permissionGranted
  };
};
