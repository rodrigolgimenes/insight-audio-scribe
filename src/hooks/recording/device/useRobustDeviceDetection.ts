
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  
  // Refs to track state and avoid repetitive operations
  const isMounted = useRef(false);
  const deviceDetectionInProgress = useRef(false);
  const deviceUpdateTimeRef = useRef(0);
  const deviceCacheRef = useRef<AudioDevice[]>([]);
  const deviceCacheTimeRef = useRef(0);
  const deviceCacheTTL = 5000; // 5 seconds
  const initialCheckPerformed = useRef(false);
  const deviceSelectionAttempted = useRef(false);
  
  // Update permission state based on permission status
  useEffect(() => {
    setPermissionState(permissionStatus);
  }, [permissionStatus]);
  
  // Debounced device selection function
  const debouncedSetDeviceIdRef = useRef<NodeJS.Timeout | null>(null);
  
  const setSelectedDeviceIdDebounced = useCallback((deviceId: string | null) => {
    if (debouncedSetDeviceIdRef.current) {
      clearTimeout(debouncedSetDeviceIdRef.current);
    }
    
    debouncedSetDeviceIdRef.current = setTimeout(() => {
      console.log('[useRobustDeviceDetection] Setting selected device ID:', deviceId);
      setSelectedDeviceId(deviceId);
      
      // Only mark selection as ready if we have a valid ID
      if (deviceId) {
        setDeviceSelectionReady(true);
      }
    }, 300);
  }, []);
  
  // Function to request microphone access
  const requestMicrophoneAccess = useCallback(async (skipCheck = false): Promise<boolean> => {
    // If we're already loading, don't start a new request
    if (isLoading && !skipCheck) {
      console.log('[useRobustDeviceDetection] Microphone access request already in progress');
      return permissionState === 'granted';
    }
    
    console.log('[useRobustDeviceDetection] Requesting microphone access');
    setIsLoading(true);
    setDeviceError(null);
    
    try {
      if (!skipCheck) {
        const hasPermission = await checkPermissions();
        if (hasPermission) {
          console.log('[useRobustDeviceDetection] Already have permission');
          setPermissionState('granted');
          setIsLoading(false);
          return true;
        }
      }
      
      // Use a more modern approach to request permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop all tracks on the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      console.log('[useRobustDeviceDetection] Microphone access granted');
      setPermissionState('granted');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('[useRobustDeviceDetection] Microphone access denied:', error);
      setDeviceError('Microphone access denied. Please check your browser settings.');
      setPermissionState('denied');
      setIsLoading(false);
      return false;
    }
  }, [checkPermissions, isLoading, permissionState]);
  
  // Function to detect available devices
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{ devices: AudioDevice[]; defaultId: string | null }> => {
    const now = Date.now();
    
    // Prevent duplicate detection requests
    if (deviceDetectionInProgress.current && !forceRefresh) {
      console.log('[useRobustDeviceDetection] Device detection already in progress, skipping');
      return { devices, defaultId: null };
    }
    
    // Use cached devices if available and not forcing refresh
    if (!forceRefresh && 
        deviceCacheRef.current.length > 0 && 
        (now - deviceCacheTimeRef.current) < deviceCacheTTL) {
      console.log('[useRobustDeviceDetection] Using cached devices, age:', now - deviceCacheTimeRef.current, 'ms');
      return { devices: deviceCacheRef.current, defaultId: null };
    }
    
    console.log('[useRobustDeviceDetection] Detecting devices');
    deviceDetectionInProgress.current = true;
    setIsLoading(true);
    setDeviceError(null);
    
    try {
      // Ensure we have permission before enumerating
      if (permissionState !== 'granted') {
        console.log('[useRobustDeviceDetection] Permission not granted, requesting...');
        const hasPermission = await requestMicrophoneAccess(true);
        if (!hasPermission) {
          console.warn('[useRobustDeviceDetection] No permission to access devices');
          deviceDetectionInProgress.current = false;
          setIsLoading(false);
          return { devices: [], defaultId: null };
        }
      }
      
      // Enumerate devices
      console.log('[useRobustDeviceDetection] Getting audio devices');
      const { devices: detectedDevices, defaultId } = await getAudioDevices();
      
      if (detectedDevices.length === 0) {
        console.warn('[useRobustDeviceDetection] No devices detected');
        setDeviceError('No microphones detected. Please ensure a microphone is connected.');
      }
      
      // Update state only if mounted and devices have changed
      if (isMounted.current) {
        const devicesChanged = devices.length !== detectedDevices.length || 
          !devices.every((d, i) => detectedDevices[i] && d.deviceId === detectedDevices[i].deviceId);
          
        if (devicesChanged || devices.length === 0) {
          console.log('[useRobustDeviceDetection] Updating devices state with:', detectedDevices.length, 'devices');
          setDevices(detectedDevices);
          
          // Update cache
          deviceCacheRef.current = detectedDevices;
          deviceCacheTimeRef.current = now;
          deviceUpdateTimeRef.current = now;
        }
        
        // Auto-select the first device if none is selected
        if (!deviceSelectionAttempted.current && !selectedDeviceId && detectedDevices.length > 0) {
          console.log('[useRobustDeviceDetection] Auto-selecting first device:', detectedDevices[0].deviceId);
          setSelectedDeviceIdDebounced(detectedDevices[0].deviceId);
          deviceSelectionAttempted.current = true;
        } else if (selectedDeviceId) {
          // Check if selectedDeviceId still exists in the list
          const deviceExists = detectedDevices.some(d => d.deviceId === selectedDeviceId);
          if (!deviceExists && detectedDevices.length > 0) {
            console.log('[useRobustDeviceDetection] Selected device no longer exists, selecting first device');
            setSelectedDeviceIdDebounced(detectedDevices[0].deviceId);
          }
        }
      }
      
      deviceDetectionInProgress.current = false;
      setIsLoading(false);
      return { devices: detectedDevices, defaultId };
    } catch (error: any) {
      console.error('[useRobustDeviceDetection] Error detecting devices:', error);
      setDeviceError('Error detecting devices. Please check your microphone and browser settings.');
      deviceDetectionInProgress.current = false;
      setIsLoading(false);
      return { devices: [], defaultId: null };
    }
  }, [getAudioDevices, permissionState, requestMicrophoneAccess, devices, selectedDeviceId, setSelectedDeviceIdDebounced]);
  
  // Initial device check on mount
  useEffect(() => {
    isMounted.current = true;
    
    // Only perform initial check once per component lifecycle
    if (!initialCheckPerformed.current) {
      const initialCheck = async () => {
        console.log('[useRobustDeviceDetection] Performing initial device check');
        initialCheckPerformed.current = true;
        
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
    }
    
    // Add a device change listener
    const handleDeviceChange = () => {
      // Don't respond to rapid successive events
      const now = Date.now();
      const timeSinceLastUpdate = now - deviceUpdateTimeRef.current;
      
      if (timeSinceLastUpdate > 1000) { // Only process device change event if at least 1 second has elapsed
        console.log('[useRobustDeviceDetection] Device change detected by browser');
        detectDevices();
      } else {
        console.log('[useRobustDeviceDetection] Ignoring rapid device change event, last update:', timeSinceLastUpdate, 'ms ago');
      }
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      
      // Clear any debounced operations
      if (debouncedSetDeviceIdRef.current) {
        clearTimeout(debouncedSetDeviceIdRef.current);
      }
    };
  }, [detectDevices, permissionState, requestMicrophoneAccess]);
  
  // Effect to set device selection ready when a device is selected and initial check is complete
  useEffect(() => {
    if (selectedDeviceId && initialDeviceCheckComplete) {
      console.log('[useRobustDeviceDetection] Device selection ready');
      setDeviceSelectionReady(true);
    } else if (!selectedDeviceId) {
      setDeviceSelectionReady(false);
    }
  }, [selectedDeviceId, initialDeviceCheckComplete]);
  
  // Return memoized values to prevent re-renders
  return useMemo(() => ({
    devices,
    selectedDeviceId,
    setSelectedDeviceId: setSelectedDeviceIdDebounced,
    isLoading,
    deviceError,
    deviceSelectionReady,
    permissionState,
    requestMicrophoneAccess,
    detectDevices
  }), [
    devices,
    selectedDeviceId,
    setSelectedDeviceIdDebounced,
    isLoading,
    deviceError,
    deviceSelectionReady,
    permissionState,
    requestMicrophoneAccess,
    detectDevices
  ]);
};
