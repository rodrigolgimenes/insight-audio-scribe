
import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useToast } from "@/hooks/use-toast";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const { getAudioDevices, audioDevices, defaultDeviceId, requestMicrophoneAccess, checkPermissions } = useAudioCapture();
  const { toast } = useToast();
  const deviceInitializationAttempted = useRef(false);

  const handleDeviceSelect = useCallback((deviceId: string) => {
    console.log('[useDeviceSelection] Setting device ID:', deviceId);
    
    if (deviceId && audioDevices.some(device => device.deviceId === deviceId)) {
      setSelectedDeviceId(deviceId);
      setDeviceSelectionReady(true);
      console.log('[useDeviceSelection] Device selected successfully:', deviceId);
    } else {
      console.warn('[useDeviceSelection] Attempted to select invalid device ID:', deviceId);
      // Don't clear the selection if the ID is invalid - might be just a temporary issue
    }
  }, [audioDevices]);

  // Initialize devices when the component mounts
  useEffect(() => {
    const initDevices = async () => {
      if (deviceInitializationAttempted.current) {
        console.log('[useDeviceSelection] Device initialization already attempted, skipping');
        return;
      }
      
      deviceInitializationAttempted.current = true;
      console.log('[useDeviceSelection] Initializing audio devices');
      
      // Request permissions first
      await checkPermissions();
      
      try {
        const devices = await getAudioDevices();
        console.log('[useDeviceSelection] Got audio devices:', devices.length);
        
        if (devices.length === 0) {
          console.warn('[useDeviceSelection] No audio devices found');
          toast({
            title: "Warning",
            description: "No microphones found. Please connect a microphone and try again.",
            variant: "destructive",
          });
          setDeviceSelectionReady(false);
        } else if (defaultDeviceId) {
          // Auto-select the default device if available
          handleDeviceSelect(defaultDeviceId);
        }
      } catch (error) {
        console.error('[useDeviceSelection] Error initializing devices:', error);
        toast({
          title: "Error",
          description: "Failed to access audio devices. Check browser permissions.",
          variant: "destructive",
        });
        setDeviceSelectionReady(false);
      }
    };
    
    initDevices();
  }, [getAudioDevices, toast, handleDeviceSelect, defaultDeviceId, checkPermissions]);

  // Reset selection if selected device is no longer available
  useEffect(() => {
    if (selectedDeviceId && audioDevices.length > 0) {
      const deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.warn('[useDeviceSelection] Selected device no longer available, resetting selection');
        // Instead of resetting, try to select the default device
        if (defaultDeviceId) {
          handleDeviceSelect(defaultDeviceId);
        }
      }
    }
  }, [selectedDeviceId, audioDevices, defaultDeviceId, handleDeviceSelect]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId: handleDeviceSelect,
    deviceSelectionReady,
    refreshDevices: getAudioDevices
  };
};
