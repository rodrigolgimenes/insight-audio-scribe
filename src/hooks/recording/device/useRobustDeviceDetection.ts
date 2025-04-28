
import { useState, useEffect, useCallback, useRef } from "react";
import { AudioDevice } from "../capture/types";
import { PermissionState } from "../capture/permissions/types";
import { usePermissionMonitor } from "../capture/permissions/permissionMonitor";

/**
 * Hook for robust microphone detection and management
 */
export const useRobustDeviceDetection = (
  getAudioDevices: () => Promise<{ devices: AudioDevice[]; defaultId: string | null }>,
  checkPermissions: () => Promise<boolean>
) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [deviceSelectionReady, setDeviceSelectionReady] = useState(false);
  const [initialDeviceCheckComplete, setInitialDeviceCheckComplete] = useState(false);
  const { permissionStatus } = usePermissionMonitor();
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  
  // Ref to track if the component is mounted
  const isMounted = useRef(false);
  
  // Update permission state based on permission status
  useEffect(() => {
    setPermissionState(permissionStatus);
  }, [permissionStatus]);
  
  // Function to request microphone access
  const requestMicrophoneAccess = useCallback(async (skipCheck = false): Promise<boolean> => {
    console.log('[useRobustDeviceDetection] Requesting microphone access');
    setIsLoading(true);
    setDeviceError(null);
    
    try {
      if (!skipCheck) {
        const hasPermission = await checkPermissions();
        if (hasPermission) {
          console.log('[useRobustDeviceDetection] Already have permission');
          setPermissionState('granted');
          return true;
        }
      }
      
      // Use a more modern approach to request permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop all tracks on the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      console.log('[useRobustDeviceDetection] Microphone access granted');
      setPermissionState('granted');
      return true;
    } catch (error: any) {
      console.error('[useRobustDeviceDetection] Microphone access denied:', error);
      setDeviceError('Microphone access denied. Please check your browser settings.');
      setPermissionState('denied');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions]);
  
  // Function to detect available devices
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{ devices: AudioDevice[]; defaultId: string | null }> => {
    console.log('[useRobustDeviceDetection] Detecting devices');
    setIsLoading(true);
    setDeviceError(null);
    
    try {
      // Ensure we have permission before enumerating
      if (permissionState !== 'granted') {
        const hasPermission = await requestMicrophoneAccess(true);
        if (!hasPermission) {
          console.warn('[useRobustDeviceDetection] No permission to access devices');
          return { devices: [], defaultId: null };
        }
      }
      
      // Enumerate devices
      const { devices: detectedDevices, defaultId } = await getAudioDevices();
      
      if (detectedDevices.length === 0) {
        console.warn('[useRobustDeviceDetection] No devices detected');
        setDeviceError('No microphones detected. Please ensure a microphone is connected.');
      }
      
      // Update state only if mounted
      if (isMounted.current) {
        setDevices(detectedDevices);
        
        // Auto-select the first device if none is selected
        if (!selectedDeviceId && detectedDevices.length > 0) {
          console.log('[useRobustDeviceDetection] Auto-selecting first device:', detectedDevices[0].deviceId);
          setSelectedDeviceId(detectedDevices[0].deviceId);
        }
      }
      
      return { devices: detectedDevices, defaultId };
    } catch (error: any) {
      console.error('[useRobustDeviceDetection] Error detecting devices:', error);
      setDeviceError('Error detecting devices. Please check your microphone and browser settings.');
      return { devices: [], defaultId: null };
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [getAudioDevices, permissionState, requestMicrophoneAccess, selectedDeviceId]);
  
  // Initial device check on mount
  useEffect(() => {
    isMounted.current = true;
    
    const initialCheck = async () => {
      console.log('[useRobustDeviceDetection] Performing initial device check');
      
      // First, check permissions
      if (permissionState !== 'granted') {
        console.log('[useRobustDeviceDetection] Requesting permissions before initial device check');
        await requestMicrophoneAccess(true);
      }
      
      // Then, detect devices
      await detectDevices();
      
      // Mark initial check as complete
      setInitialDeviceCheckComplete(true);
    };
    
    initialCheck();
    
    // Add a device change listener
    const handleDeviceChange = () => {
      console.log('[useRobustDeviceDetection] Device change detected by browser');
      detectDevices();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [detectDevices, permissionState, requestMicrophoneAccess]);
  
  // Effect to set device selection ready when a device is selected and initial check is complete
  useEffect(() => {
    if (selectedDeviceId && initialDeviceCheckComplete) {
      console.log('[useRobustDeviceDetection] Device selection ready');
      setDeviceSelectionReady(true);
    } else {
      setDeviceSelectionReady(false);
    }
  }, [selectedDeviceId, initialDeviceCheckComplete]);
  
  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    isLoading,
    deviceError,
    deviceSelectionReady,
    permissionState,
    requestMicrophoneAccess,
    detectDevices
  };
};
