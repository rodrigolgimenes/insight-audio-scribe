
import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioDevice } from '@/hooks/recording/capture/types';
import { toast } from 'sonner';

/**
 * A stable microphone detection hook that prevents duplicate notifications
 * and handles visibility changes properly
 */
export function useStableMicrophoneDetection() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  
  // Refs for tracking state between rerenders
  const mountedRef = useRef(true);
  const detectionInProgressRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const hasShownNoMicNotificationRef = useRef(false);
  const lastVisibilityStateRef = useRef(document.visibilityState);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce function to prevent rapid successive calls
  const debounce = useCallback((fn: Function, delay: number) => {
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }
    
    detectionTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        fn();
      }
    }, delay);
  }, []);
  
  // Check if we're on a restricted route
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path.includes('/app') || 
           path === '/dashboard' || 
           path.includes('simple-record') || 
           path.includes('record');
  }, []);
  
  // Format devices helper
  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter(device => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        groupId: device.groupId,
        isDefault: device.deviceId === 'default' || index === 0,
        index
      }));
  }, []);
  
  // Check permission status
  const checkPermissionStatus = useCallback(async (): Promise<'prompt' | 'granted' | 'denied' | 'unknown'> => {
    if (!navigator.permissions) {
      console.log('[useStableMicrophoneDetection] Permissions API not available');
      return 'unknown';
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('[useStableMicrophoneDetection] Permission status:', result.state);
      return result.state as 'prompt' | 'granted' | 'denied' | 'unknown';
    } catch (err) {
      console.error('[useStableMicrophoneDetection] Error checking permission:', err);
      return 'unknown';
    }
  }, []);
  
  // Request microphone access
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    // Don't proceed if detection is already in progress
    if (detectionInProgressRef.current) {
      console.log('[useStableMicrophoneDetection] Detection already in progress, skipping');
      return false;
    }
    
    const now = Date.now();
    // Debounce calls within 1 second
    if (now - lastDetectionTimeRef.current < 1000) {
      console.log('[useStableMicrophoneDetection] Debouncing microphone access request');
      return false;
    }
    
    lastDetectionTimeRef.current = now;
    detectionInProgressRef.current = true;
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop tracks immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return false;
      }
      
      setPermissionState('granted');
      
      // Only show toast if not on restricted route and user hasn't seen it before
      const restricted = isRestrictedRoute();
      if (!restricted && document.visibilityState === 'visible' && permissionState !== 'granted') {
        console.log('[useStableMicrophoneDetection] Showing microphone access granted toast');
        toast.success("Microphone access granted", {
          id: "mic-permission-granted",
          duration: 2000
        });
      }
      
      return true;
    } catch (err) {
      console.error('[useStableMicrophoneDetection] Microphone access error:', err);
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return false;
      }
      
      // Handle permission denied error
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionState('denied');
        
        // Only show error if not on restricted route and user is looking at the page
        if (!isRestrictedRoute() && document.visibilityState === 'visible') {
          toast.error("Microphone access denied", {
            description: "Please allow microphone access in your browser settings",
            id: "mic-permission-denied",
            duration: 3000
          });
        }
      }
      
      return false;
    } finally {
      if (mountedRef.current) {
        detectionInProgressRef.current = false;
        setIsLoading(false);
      }
    }
  }, [isRestrictedRoute, permissionState]);
  
  // Detect available microphones
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{
    devices: AudioDevice[];
    defaultId: string | null;
  }> => {
    // Prevent multiple simultaneous detections
    if (detectionInProgressRef.current && !forceRefresh) {
      console.log('[useStableMicrophoneDetection] Detection already in progress, returning cached devices');
      return { devices, defaultId: devices.length > 0 ? devices[0].deviceId : null };
    }
    
    const now = Date.now();
    // Debounce requests that come too quickly
    if (!forceRefresh && now - lastDetectionTimeRef.current < 1000) {
      console.log('[useStableMicrophoneDetection] Debouncing device detection');
      return { devices, defaultId: devices.length > 0 ? devices[0].deviceId : null };
    }
    
    lastDetectionTimeRef.current = now;
    detectionInProgressRef.current = true;
    
    // Only show loading if we don't already have devices
    if (devices.length === 0) {
      setIsLoading(true);
    }
    
    try {
      // Check current permission state
      const permStatus = await checkPermissionStatus();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      // Update permission state
      setPermissionState(permStatus);
      
      // Request permission if needed
      if (permStatus !== 'granted') {
        const granted = await requestMicrophoneAccess();
        if (!granted || !mountedRef.current) {
          detectionInProgressRef.current = false;
          return { devices: [], defaultId: null };
        }
      }
      
      // Now enumerate devices
      console.log('[useStableMicrophoneDetection] Enumerating devices...');
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      // Filter and format audio devices
      const audioInputDevices = formatDevices(
        mediaDevices.filter(d => d.kind === 'audioinput')
      );
      
      console.log(`[useStableMicrophoneDetection] Found ${audioInputDevices.length} audio inputs`);
      
      // Get default device ID
      let defaultId = null;
      const defaultDevice = audioInputDevices.find(d => d.isDefault);
      
      if (defaultDevice) {
        defaultId = defaultDevice.deviceId;
      } else if (audioInputDevices.length > 0) {
        defaultId = audioInputDevices[0].deviceId;
      }
      
      // Update state with found devices
      setDevices(audioInputDevices);
      
      // Only show "No microphones" toast if:
      // 1. We have permission
      // 2. We found no devices
      // 3. We haven't shown this notification yet
      // 4. We're not on a restricted route
      // 5. The page is visible
      if (
        audioInputDevices.length === 0 && 
        permStatus === 'granted' && 
        !hasShownNoMicNotificationRef.current && 
        !isRestrictedRoute() &&
        document.visibilityState === 'visible'
      ) {
        toast.error("No microphone found", {
          description: "Please connect a microphone and try again",
          id: "no-microphone-found",
          duration: 3000
        });
        // Mark notification as shown
        hasShownNoMicNotificationRef.current = true;
      }
      
      // Reset the notification shown flag if we now have devices
      if (audioInputDevices.length > 0) {
        hasShownNoMicNotificationRef.current = false;
      }
      
      return { devices: audioInputDevices, defaultId };
    } catch (err) {
      console.error('[useStableMicrophoneDetection] Error detecting devices:', err);
      return { devices: [], defaultId: null };
    } finally {
      if (mountedRef.current) {
        detectionInProgressRef.current = false;
        setIsLoading(false);
      }
    }
  }, [devices, checkPermissionStatus, requestMicrophoneAccess, formatDevices, isRestrictedRoute]);
  
  // Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentVisibility = document.visibilityState;
      
      console.log('[useStableMicrophoneDetection] Visibility changed:', {
        from: lastVisibilityStateRef.current,
        to: currentVisibility
      });
      
      // Only re-detect devices if becoming visible after being hidden
      // and it's been more than 5 seconds since our last detection
      if (
        lastVisibilityStateRef.current === 'hidden' && 
        currentVisibility === 'visible' &&
        Date.now() - lastDetectionTimeRef.current > 5000
      ) {
        console.log('[useStableMicrophoneDetection] Re-detecting devices after visibility change');
        debounce(() => detectDevices(true), 500);
      }
      
      lastVisibilityStateRef.current = currentVisibility;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [detectDevices, debounce]);
  
  // Initial device detection and cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial device detection
    detectDevices().catch(err => {
      console.error('[useStableMicrophoneDetection] Initial detection error:', err);
    });
    
    // Add device change listener
    const handleDeviceChange = () => {
      console.log('[useStableMicrophoneDetection] Device change event detected');
      debounce(() => detectDevices(true), 500);
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [detectDevices, debounce]);
  
  return {
    devices,
    isLoading,
    permissionState,
    detectDevices,
    requestMicrophoneAccess
  };
}
