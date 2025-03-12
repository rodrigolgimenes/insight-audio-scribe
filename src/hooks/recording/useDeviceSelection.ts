
import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useToast } from "@/hooks/use-toast";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const { getAudioDevices, audioDevices, defaultDeviceId, requestMicrophoneAccess } = useAudioCapture();
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
      setSelectedDeviceId(null);
      setDeviceSelectionReady(false);
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

  // Reset selection if selected device is no longer available
  useEffect(() => {
    if (selectedDeviceId && audioDevices.length > 0) {
      const deviceExists = audioDevices.some(device => device.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.warn('[useDeviceSelection] Selected device no longer available, resetting selection');
        setSelectedDeviceId(null);
        setDeviceSelectionReady(false);
      }
    }
  }, [selectedDeviceId, audioDevices]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId: handleDeviceSelect,
    deviceSelectionReady
  };
};
