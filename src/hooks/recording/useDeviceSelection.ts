
import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { toast } from "sonner";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const { getAudioDevices, audioDevices, defaultDeviceId, requestMicrophoneAccess, checkPermissions } = useAudioCapture();
  const deviceInitializationAttempted = useRef(false);

  const handleDeviceSelect = useCallback((deviceId: string) => {
    console.log('[useDeviceSelection] Setting device ID:', deviceId);
    
    if (deviceId) {
      setSelectedDeviceId(deviceId);
      setDeviceSelectionReady(true);
      console.log('[useDeviceSelection] Device selected successfully:', deviceId);
      toast.success("Microphone selected successfully");
    } else {
      console.warn('[useDeviceSelection] Attempted to select invalid device ID:', deviceId);
      setDeviceSelectionReady(false);
      toast.error("Invalid microphone selection");
    }
  }, []);

  // Initialize devices when the component mounts
  useEffect(() => {
    const initDevices = async () => {
      if (deviceInitializationAttempted.current) {
        console.log('[useDeviceSelection] Device initialization already attempted, skipping');
        return;
      }
      
      deviceInitializationAttempted.current = true;
      console.log('[useDeviceSelection] Initializing audio devices');
      
      const hasPermission = await checkPermissions();
      console.log('[useDeviceSelection] Permission check result:', hasPermission);
      
      if (!hasPermission) {
        setDeviceSelectionReady(false);
        return;
      }

      try {
        const devices = await getAudioDevices();
        console.log('[useDeviceSelection] Got audio devices:', devices.length);
        
        if (devices.length === 0) {
          console.warn('[useDeviceSelection] No audio devices found');
          toast.error("No microphones found. Please connect a microphone and try again.");
          setDeviceSelectionReady(false);
        } else if (defaultDeviceId) {
          handleDeviceSelect(defaultDeviceId);
        } else if (devices.length > 0 && devices[0].deviceId) {
          handleDeviceSelect(devices[0].deviceId);
        }
      } catch (error) {
        console.error('[useDeviceSelection] Error initializing devices:', error);
        toast.error("Failed to access audio devices. Check browser permissions.");
        setDeviceSelectionReady(false);
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
        setDeviceSelectionReady(false);
        
        if (defaultDeviceId) {
          handleDeviceSelect(defaultDeviceId);
        } else if (audioDevices[0]?.deviceId) {
          handleDeviceSelect(audioDevices[0].deviceId);
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
