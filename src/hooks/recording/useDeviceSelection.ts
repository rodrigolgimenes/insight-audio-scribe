import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useToast } from "@/hooks/use-toast";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const { getAudioDevices, audioDevices, defaultDeviceId } = useAudioCapture();
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
      
      if (audioDevices.length > 0) {
        const fallbackDevice = audioDevices[0].deviceId;
        console.log('[useDeviceSelection] Falling back to first available device:', fallbackDevice);
        setSelectedDeviceId(fallbackDevice);
        setDeviceSelectionReady(true);
      } else {
        setSelectedDeviceId(null);
        setDeviceSelectionReady(false);
      }
    }
  }, [audioDevices]);

  useEffect(() => {
    const initDevices = async () => {
      if (deviceInitializationAttempted.current) {
        console.log('[useDeviceSelection] Device initialization already attempted, skipping');
        return;
      }
      
      deviceInitializationAttempted.current = true;
      console.log('[useDeviceSelection] Initializing audio devices');
      
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
  }, [getAudioDevices, toast]);

  useEffect(() => {
    if (audioDevices.length > 0 && !selectedDeviceId) {
      console.log('[useDeviceSelection] Trying to select a default device');
      
      if (defaultDeviceId) {
        console.log('[useDeviceSelection] Setting default device:', defaultDeviceId);
        handleDeviceSelect(defaultDeviceId);
      } else {
        console.log('[useDeviceSelection] No default device, selecting first available device');
        handleDeviceSelect(audioDevices[0].deviceId);
      }
    }
  }, [defaultDeviceId, selectedDeviceId, audioDevices, handleDeviceSelect]);

  useEffect(() => {
    if (selectedDeviceId && audioDevices.length > 0) {
      const deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.warn('[useDeviceSelection] Selected device no longer available, resetting selection');
        
        if (audioDevices.length > 0) {
          console.log('[useDeviceSelection] Selecting first available device as fallback');
          handleDeviceSelect(audioDevices[0].deviceId);
        } else {
          setSelectedDeviceId(null);
          setDeviceSelectionReady(false);
        }
      } else if (!deviceSelectionReady) {
        setDeviceSelectionReady(true);
      }
    }
  }, [selectedDeviceId, audioDevices, deviceSelectionReady, handleDeviceSelect]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId: handleDeviceSelect,
    deviceSelectionReady
  };
};
