
import { useState, useEffect, useCallback } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useToast } from "@/hooks/use-toast";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const { getAudioDevices, audioDevices, defaultDeviceId } = useAudioCapture();
  const { toast } = useToast();

  // Safe device selection handler that validates the device ID
  const handleDeviceSelect = useCallback((deviceId: string) => {
    console.log('[useDeviceSelection] Setting device ID:', deviceId);
    if (deviceId && audioDevices.some(device => device.deviceId === deviceId)) {
      setSelectedDeviceId(deviceId);
      setDeviceSelectionReady(true);
    } else {
      console.warn('[useDeviceSelection] Attempted to select invalid device ID:', deviceId);
    }
  }, [audioDevices]);

  // Initialize audio devices on mount
  useEffect(() => {
    const initDevices = async () => {
      console.log('[useDeviceSelection] Initializing audio devices');
      try {
        await getAudioDevices();
        setDeviceSelectionReady(false); // Reset until we've selected a valid device
      } catch (error) {
        console.error('[useDeviceSelection] Error initializing devices:', error);
        toast({
          title: "Error",
          description: "Failed to access audio devices. Check browser permissions.",
          variant: "destructive",
        });
      }
    };
    
    initDevices();
  }, [getAudioDevices, toast]);

  // This effect sets the selected device to the default device when available
  useEffect(() => {
    if (defaultDeviceId && !selectedDeviceId && audioDevices.length > 0) {
      console.log('[useDeviceSelection] Setting default device:', defaultDeviceId);
      handleDeviceSelect(defaultDeviceId);
    } else if (audioDevices.length > 0 && !selectedDeviceId) {
      // Fallback to first device if default is not available
      console.log('[useDeviceSelection] No default device, selecting first available device');
      handleDeviceSelect(audioDevices[0].deviceId);
    }
  }, [defaultDeviceId, selectedDeviceId, audioDevices, handleDeviceSelect]);

  // Extra validation to ensure selected device exists in the list
  useEffect(() => {
    if (selectedDeviceId && audioDevices.length > 0) {
      const deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      if (!deviceExists) {
        console.warn('[useDeviceSelection] Selected device no longer available, resetting selection');
        setSelectedDeviceId(null);
        setDeviceSelectionReady(false);
      } else if (!deviceSelectionReady) {
        setDeviceSelectionReady(true);
      }
    }
  }, [selectedDeviceId, audioDevices, deviceSelectionReady]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId: handleDeviceSelect,
    deviceSelectionReady
  };
};
