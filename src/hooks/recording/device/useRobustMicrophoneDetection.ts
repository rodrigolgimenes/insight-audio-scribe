
import { useState, useCallback } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { PermissionState } from "@/hooks/recording/capture/permissions/types";

export function useRobustMicrophoneDetection() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      setIsLoading(false);
      return true;
    } catch (err) {
      setPermissionState("denied");
      setIsLoading(false);
      return false;
    }
  }, []);

  const detectDevices = useCallback(async () => {
    if (permissionState !== 'granted') {
      const hasPermission = await requestMicrophoneAccess();
      if (!hasPermission) return { devices: [], defaultId: null };
    }
    
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === "audioinput");
      const formattedDevices = audioInputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        groupId: device.groupId,
        kind: device.kind,
        isDefault: device.deviceId === "default" || index === 0,
        index
      }));
      
      setDevices(formattedDevices);
      setIsLoading(false);
      
      const defaultDevice = formattedDevices.find(d => d.isDefault);
      return { 
        devices: formattedDevices, 
        defaultId: defaultDevice?.deviceId || formattedDevices[0]?.deviceId || null 
      };
    } catch (err) {
      setDevices([]);
      setIsLoading(false);
      return { devices: [], defaultId: null };
    }
  }, [permissionState, requestMicrophoneAccess]);

  return {
    devices,
    isLoading,
    permissionState,
    detectDevices,
    requestMicrophoneAccess
  };
}
