
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { AudioDevice, toAudioDevice } from "./types";

export const useDeviceEnumeration = (checkPermissions: () => Promise<boolean>) => {
  const { toast } = useToast();
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);

  const getAudioDevices = useCallback(async (): Promise<AudioDevice[]> => {
    try {
      // First check if we have permission
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        console.warn('[useDeviceEnumeration] Cannot list devices without permission');
        return [];
      }
      
      console.log('[useDeviceEnumeration] Enumerating audio devices');
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => {
          const isDefault = device.deviceId === 'default' || 
                           device.label.toLowerCase().includes('default') || 
                           device.label.toLowerCase().includes('padrão');
          
          return toAudioDevice(device, isDefault);
        });

      console.log('[useDeviceEnumeration] Found audio devices:', audioInputs);

      if (audioInputs.length === 0) {
        toast({
          title: "Warning",
          description: "No microphones found. Please connect a microphone and try again.",
          variant: "destructive",
        });
        return [];
      }
      
      // Look for default device
      const defaultDevice = audioInputs.find(device => device.isDefault);
      const firstDeviceId = audioInputs[0].deviceId;
      
      if (defaultDevice) {
        console.log('[useDeviceEnumeration] Found default device:', defaultDevice.label);
        setDefaultDeviceId(defaultDevice.deviceId);
      } else {
        console.log('[useDeviceEnumeration] No default device found, using first device:', firstDeviceId);
        setDefaultDeviceId(firstDeviceId);
      }
      
      setAudioDevices(audioInputs);
      
      return audioInputs;
    } catch (error) {
      console.error('[useDeviceEnumeration] Error getting audio devices:', error);
      toast({
        title: "Error",
        description: "Failed to list audio devices. Check browser permissions.",
        variant: "destructive",
      });
      return [];
    }
  }, [checkPermissions, toast]);

  return {
    audioDevices,
    defaultDeviceId,
    getAudioDevices
  };
};
