
import { useState, useEffect, useCallback, useRef } from "react";
import { AudioDevice } from "../capture/types";
import { PermissionState } from "../capture/permissions/types";
import { usePermissionMonitor } from "../capture/permissions/permissionMonitor";

export const useRobustMicrophoneDetection = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  
  // Prevent duplicate checks
  const detectionInProgressRef = useRef(false);
  const { permissionStatus } = usePermissionMonitor();
  
  // Update permission state based on permission status
  useEffect(() => {
    setPermissionState(permissionStatus);
  }, [permissionStatus]);
  
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    if (detectionInProgressRef.current) {
      console.log('[useRobustMicrophoneDetection] Detection already in progress');
      return permissionState === "granted";
    }
    
    setIsLoading(true);
    detectionInProgressRef.current = true;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState('granted');
      setIsLoading(false);
      detectionInProgressRef.current = false;
      return true;
    } catch (err) {
      console.error('[useRobustMicrophoneDetection] Permission denied:', err);
      setPermissionState('denied');
      setIsLoading(false);
      detectionInProgressRef.current = false;
      return false;
    }
  }, [permissionState]);

  const detectDevices = useCallback(async () => {
    console.log('[useRobustMicrophoneDetection] Detecting devices');
    setIsLoading(true);
    
    try {
      // Ensure we have permission before enumerating
      if (permissionState !== 'granted') {
        const hasPermission = await requestMicrophoneAccess();
        if (!hasPermission) {
          console.warn('[useRobustMicrophoneDetection] No permission to access devices');
          setDevices([]);
          setIsLoading(false);
          return { devices: [], defaultId: null };
        }
      }
      
      // Simple, direct device enumeration
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
      
      console.log(`[useRobustMicrophoneDetection] Found ${formattedDevices.length} devices`);
      setDevices(formattedDevices);
      
      const defaultDevice = formattedDevices.find(d => d.isDefault);
      setIsLoading(false);
      
      return { 
        devices: formattedDevices, 
        defaultId: defaultDevice?.deviceId || formattedDevices[0]?.deviceId || null 
      };
    } catch (error) {
      console.error('[useRobustMicrophoneDetection] Error detecting devices:', error);
      setDevices([]);
      setIsLoading(false);
      return { devices: [], defaultId: null };
    }
  }, [permissionState, requestMicrophoneAccess]);
  
  // Initial device check on mount
  useEffect(() => {
    const initialCheck = async () => {
      await detectDevices();
    };
    
    // Add device change listener
    const handleDeviceChange = () => {
      console.log('[useRobustMicrophoneDetection] Device change detected');
      detectDevices();
    };
    
    initialCheck();
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [detectDevices]);
  
  return {
    devices,
    isLoading,
    permissionState,
    detectDevices,
    requestMicrophoneAccess
  };
};
