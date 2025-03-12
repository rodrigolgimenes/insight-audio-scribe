
import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export const useDeviceSelection = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const { getAudioDevices, audioDevices, defaultDeviceId, requestMicrophoneAccess, checkPermissions } = useAudioCapture();
  const { toast: legacyToast } = useToast();
  const deviceInitializationAttempted = useRef(false);

  const handleDeviceSelect = useCallback((deviceId: string) => {
    console.log('[useDeviceSelection] Setting device ID:', deviceId);
    
    if (deviceId) {
      setSelectedDeviceId(deviceId);
      setDeviceSelectionReady(true);
      console.log('[useDeviceSelection] Device selected successfully:', deviceId);
      
      // Explicitly mark device selection as ready when a valid ID is provided
      if (!deviceSelectionReady) {
        console.log('[useDeviceSelection] Marking device selection as ready');
        setDeviceSelectionReady(true);
      }
    } else {
      console.warn('[useDeviceSelection] Attempted to select invalid device ID:', deviceId);
      // Don't clear the selection if the ID is invalid - might be just a temporary issue
    }
  }, [audioDevices, deviceSelectionReady]);

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
      const hasPermission = await checkPermissions();
      console.log('[useDeviceSelection] Permission check result:', hasPermission);
      
      try {
        const devices = await getAudioDevices();
        console.log('[useDeviceSelection] Got audio devices:', devices.length);
        
        if (devices.length === 0) {
          console.warn('[useDeviceSelection] No audio devices found');
          toast({
            title: "Warning",
            description: "No microphones found. Please connect a microphone and try again."
          });
          setDeviceSelectionReady(false);
        } else if (defaultDeviceId) {
          // Auto-select the default device if available
          handleDeviceSelect(defaultDeviceId);
        } else if (devices.length > 0 && devices[0].deviceId) {
          // If no default is set but we have devices, select the first one
          handleDeviceSelect(devices[0].deviceId);
        }
        
        // If we have permission and at least one device, mark as ready
        if (hasPermission && devices.length > 0) {
          console.log('[useDeviceSelection] Setting device selection as ready');
          setDeviceSelectionReady(true);
        }
      } catch (error) {
        console.error('[useDeviceSelection] Error initializing devices:', error);
        toast({
          title: "Error",
          description: "Failed to access audio devices. Check browser permissions."
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
        } else if (audioDevices[0] && audioDevices[0].deviceId) {
          // If no default, select first available device
          handleDeviceSelect(audioDevices[0].deviceId);
        }
      }
    }
    
    // If we have a selectedDeviceId and audioDevices, make sure deviceSelectionReady is true
    if (selectedDeviceId && audioDevices.length > 0 && !deviceSelectionReady) {
      console.log('[useDeviceSelection] We have a selected device but selection not ready - fixing');
      setDeviceSelectionReady(true);
    }
  }, [selectedDeviceId, audioDevices, defaultDeviceId, handleDeviceSelect, deviceSelectionReady]);

  return {
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId: handleDeviceSelect,
    deviceSelectionReady,
    refreshDevices: getAudioDevices
  };
};
