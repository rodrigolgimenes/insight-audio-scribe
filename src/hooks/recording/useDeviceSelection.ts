
import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { toast } from "sonner";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const { getAudioDevices, audioDevices, defaultDeviceId, requestMicrophoneAccess, checkPermissions } = useAudioCapture();
  const deviceInitializationAttempted = useRef(false);
  const selectionInProgressRef = useRef(false);
  const lastSelectedDeviceRef = useRef<string | null>(null);

  const handleDeviceSelect = useCallback((deviceId: string) => {
    // Prevent duplicate selections of the same device
    if (deviceId === lastSelectedDeviceRef.current && deviceSelectionReady) {
      console.log('[useDeviceSelection] Device already selected, skipping:', deviceId);
      return;
    }
    
    console.log('[useDeviceSelection] Setting device ID:', deviceId);
    
    if (deviceId) {
      setSelectedDeviceId(deviceId);
      setDeviceSelectionReady(true);
      lastSelectedDeviceRef.current = deviceId;
      console.log('[useDeviceSelection] Device selected successfully:', deviceId);
      
      // Show toast only when selection changes
      if (deviceId !== lastSelectedDeviceRef.current) {
        toast.success("Microphone selected successfully", {
          id: "mic-selected" // Use ID to prevent duplicates
        });
      }
    } else {
      console.warn('[useDeviceSelection] Attempted to select invalid device ID:', deviceId);
      setDeviceSelectionReady(false);
      toast.error("Invalid microphone selection", {
        id: "invalid-mic-selection" // Use ID to prevent duplicates
      });
    }
  }, [deviceSelectionReady]);

  // Initialize devices when the component mounts
  useEffect(() => {
    const initDevices = async () => {
      if (deviceInitializationAttempted.current || selectionInProgressRef.current) {
        console.log('[useDeviceSelection] Device initialization already attempted or in progress, skipping');
        return;
      }
      
      selectionInProgressRef.current = true;
      deviceInitializationAttempted.current = true;
      console.log('[useDeviceSelection] Initializing audio devices');
      
      const hasPermission = await checkPermissions();
      console.log('[useDeviceSelection] Permission check result:', hasPermission);
      
      if (!hasPermission) {
        setDeviceSelectionReady(false);
        selectionInProgressRef.current = false;
        return;
      }

      try {
        const devices = await getAudioDevices();
        console.log('[useDeviceSelection] Got audio devices:', devices.length);
        
        if (devices.length === 0) {
          console.warn('[useDeviceSelection] No audio devices found');
          setDeviceSelectionReady(false);
          selectionInProgressRef.current = false;
        } else if (defaultDeviceId) {
          handleDeviceSelect(defaultDeviceId);
          selectionInProgressRef.current = false;
        } else if (devices.length > 0 && devices[0].deviceId) {
          handleDeviceSelect(devices[0].deviceId);
          selectionInProgressRef.current = false;
        } else {
          selectionInProgressRef.current = false;
        }
      } catch (error) {
        console.error('[useDeviceSelection] Error initializing devices:', error);
        setDeviceSelectionReady(false);
        selectionInProgressRef.current = false;
      }
    };
    
    initDevices();
  }, [getAudioDevices, handleDeviceSelect, defaultDeviceId, checkPermissions]);

  // Reset selection if selected device is no longer available
  useEffect(() => {
    if (selectedDeviceId && audioDevices.length > 0) {
      const deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.warn('[useDeviceSelection] Selected device no longer available, resetting selection');
        
        // Only try to select a new device if we're not already in the process of selecting
        if (!selectionInProgressRef.current) {
          selectionInProgressRef.current = true;
          setDeviceSelectionReady(false);
          
          if (defaultDeviceId) {
            handleDeviceSelect(defaultDeviceId);
          } else if (audioDevices[0]?.deviceId) {
            handleDeviceSelect(audioDevices[0].deviceId);
          }
          
          selectionInProgressRef.current = false;
        }
      }
    }
  }, [selectedDeviceId, audioDevices, defaultDeviceId, handleDeviceSelect]);

  // Ensure we properly update the deviceSelectionReady state when a device is selected
  useEffect(() => {
    if (selectedDeviceId && audioDevices.length > 0) {
      const deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      if (deviceExists && !deviceSelectionReady) {
        console.log('[useDeviceSelection] Device exists but not marked as ready - fixing state');
        setDeviceSelectionReady(true);
      }
    }
  }, [selectedDeviceId, audioDevices, deviceSelectionReady]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId: handleDeviceSelect,
    deviceSelectionReady,
    refreshDevices: getAudioDevices
  };
};
