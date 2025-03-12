
import { useState, useEffect, useRef, useCallback } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

/**
 * Hook for robust microphone detection across different browsers
 */
export function useRobustMicrophoneDetection() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'|'unknown'>('unknown');
  const [defaultDeviceId, setDefaultDeviceId] = useState<string | null>(null);
  
  // Refs for tracking detection state
  const detectionInProgressRef = useRef(false);
  const detectionAttemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const lastDetectionTimeRef = useRef(0);
  const autoRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check for permission API support
  const hasPermissionsAPI = useRef(!!navigator.permissions);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (autoRetryTimerRef.current) {
      clearTimeout(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
  }, []);
  
  // Set up unmount cleanup
  useEffect(() => {
    mountedRef.current = true;
    return cleanup;
  }, [cleanup]);
  
  // Format devices from MediaDeviceInfo to AudioDevice
  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter(device => device.kind === 'audioinput')
      .map(device => ({
        deviceId: device.deviceId,
        groupId: device.groupId,
        kind: device.kind,
        label: device.label || `Microphone ${device.deviceId.substring(0, 5)}...`
      }));
  }, []);
  
  // Check permission status using Permissions API
  const checkPermissionStatus = useCallback(async (): Promise<'prompt'|'granted'|'denied'|'unknown'> => {
    if (!hasPermissionsAPI.current) {
      console.log('[useRobustMicrophoneDetection] Permissions API not available');
      return 'unknown';
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('[useRobustMicrophoneDetection] Permission status:', result.state);
      return result.state as 'prompt'|'granted'|'denied';
    } catch (err) {
      console.error('[useRobustMicrophoneDetection] Error checking permission:', err);
      return 'unknown';
    }
  }, []);
  
  // Request microphone access
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    console.log('[useRobustMicrophoneDetection] Requesting microphone access...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // We got access, now stop the tracks as we only needed them for permission
      stream.getTracks().forEach(track => track.stop());
      
      if (!mountedRef.current) return false;
      
      setPermissionState('granted');
      toast.success("Microphone access granted", {
        id: "mic-permission-granted"
      });
      
      return true;
    } catch (err) {
      console.error('[useRobustMicrophoneDetection] Microphone access denied:', err);
      
      if (!mountedRef.current) return false;
      
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPermissionState('denied');
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings",
          id: "mic-permission-denied"
        });
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        toast.error("No microphone found", {
          description: "Please connect a microphone and try again",
          id: "no-microphone-found"
        });
      }
      
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);
  
  // Detect available devices
  const detectDevices = useCallback(async (forceRefresh = false): Promise<AudioDevice[]> => {
    // Prevent concurrent detections or rapid successive calls
    const now = Date.now();
    if (!forceRefresh && detectionInProgressRef.current) {
      console.log('[useRobustMicrophoneDetection] Detection already in progress, skipping');
      return devices;
    }
    
    // Add short debounce protection unless forced refresh
    if (!forceRefresh && (now - lastDetectionTimeRef.current < 300)) {
      console.log('[useRobustMicrophoneDetection] Skipping due to recent detection');
      return devices;
    }
    
    // Clear any scheduled auto-retry
    if (autoRetryTimerRef.current) {
      clearTimeout(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
    
    // Track detection attempt
    detectionInProgressRef.current = true;
    lastDetectionTimeRef.current = now;
    detectionAttemptsRef.current++;
    
    console.log(`[useRobustMicrophoneDetection] Detecting devices (attempt #${detectionAttemptsRef.current})`);
    setIsLoading(true);
    
    try {
      // Update permission state first (we might already have permission)
      const permStatus = await checkPermissionStatus();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return [];
      }
      
      // Update permission state based on check
      setPermissionState(permStatus);
      
      // If we don't have permission, request it
      if (permStatus !== 'granted') {
        const granted = await requestMicrophoneAccess();
        if (!granted) {
          setIsLoading(false);
          detectionInProgressRef.current = false;
          return [];
        }
      }
      
      // Now enumerate devices
      console.log('[useRobustMicrophoneDetection] Enumerating devices...');
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return [];
      }
      
      // Filter out non-audio input devices and format to our AudioDevice type
      const audioInputDevices = formatDevices(
        mediaDevices.filter(device => device.kind === 'audioinput')
      );
      
      console.log(`[useRobustMicrophoneDetection] Found ${audioInputDevices.length} audio input devices`);
      
      // Try to find default device
      const defaultDevice = mediaDevices.find(
        device => device.kind === 'audioinput' && device.deviceId === 'default'
      );
      
      if (defaultDevice) {
        setDefaultDeviceId(defaultDevice.deviceId);
      } else if (audioInputDevices.length > 0) {
        // If no default, use the first device
        setDefaultDeviceId(audioInputDevices[0].deviceId);
      } else {
        setDefaultDeviceId(null);
      }
      
      // Update state with found devices
      setDevices(audioInputDevices);
      
      // Reset attempts counter on success
      detectionAttemptsRef.current = 0;
      
      return audioInputDevices;
    } catch (err) {
      console.error('[useRobustMicrophoneDetection] Error detecting devices:', err);
      
      // Set empty devices on error
      if (mountedRef.current) {
        setDevices([]);
      }
      
      return [];
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        detectionInProgressRef.current = false;
      }
    }
  }, [devices, checkPermissionStatus, requestMicrophoneAccess, formatDevices]);
  
  // Set up device change listener
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log('[useRobustMicrophoneDetection] Device change event detected');
      // Reset detection state
      detectionInProgressRef.current = false;
      detectDevices(true);
    };
    
    // Add listener for device changes
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // Initial detection
    detectDevices();
    
    // Monitor permission changes if available
    if (hasPermissionsAPI.current) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(permissionStatus => {
          permissionStatus.addEventListener('change', () => {
            console.log('[useRobustMicrophoneDetection] Permission status changed:', permissionStatus.state);
            // Force a device detection when permission changes
            detectDevices(true);
          });
        })
        .catch(err => {
          console.error('[useRobustMicrophoneDetection] Error setting up permission monitoring:', err);
        });
    }
    
    return () => {
      // Remove device change listener
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [detectDevices]);
  
  return {
    devices,
    isLoading,
    permissionState,
    defaultDeviceId,
    detectDevices,
    requestMicrophoneAccess
  };
}
