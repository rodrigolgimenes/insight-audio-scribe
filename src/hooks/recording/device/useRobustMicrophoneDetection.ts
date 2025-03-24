import { useState, useEffect, useRef, useCallback } from "react";
import { AudioDevice, toAudioDevice, PermissionState } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

/**
 * Hook for robust microphone detection across different browsers.
 */
export function useRobustMicrophoneDetection() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  // Refs to track detection and component lifecycle
  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  const hasPermissionsAPI = useRef(!!navigator.permissions);
  const isDashboardPage = useRef(false);
  const initialLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (initialLoadingTimeoutRef.current) {
      clearTimeout(initialLoadingTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Set a minimum loading time to avoid flashing UI
    initialLoadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        // Only stop loading if we have devices or we've tried multiple times
        if (devices.length > 0 || refreshAttempts > 2) {
          setIsLoading(false);
        }
      }
    }, 1500);
    
    return cleanup;
  }, [cleanup, devices.length, refreshAttempts]);

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

  /**
   * Formats MediaDeviceInfo array into AudioDevice array
   */
  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => {
        // If deviceId is 'default' or if this is the first device, mark as default
        const isDefault = device.deviceId === "default" || index === 0;
        return toAudioDevice(device, isDefault, index);
      });
  }, []);

  /**
   * Checks the current microphone permission state
   */
  const checkPermissionStatus = useCallback(async (): Promise<PermissionState> => {
    if (!hasPermissionsAPI.current) {
      console.log("[useRobustMicrophoneDetection] Permissions API not available");
      return "unknown";
    }
    
    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      console.log("[useRobustMicrophoneDetection] Permission status:", result.state);
      return result.state as PermissionState;
    } catch (err) {
      console.error("[useRobustMicrophoneDetection] Error checking permission:", err);
      return "unknown";
    }
  }, []);

  /**
   * Requests microphone access
   */
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    console.log("[useRobustMicrophoneDetection] Requesting microphone access...");

    // Check if we're on a restricted route before showing any toasts
    const restricted = isRestrictedRoute();
    isDashboardPage.current = restricted;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop tracks immediately after getting permission
      stream.getTracks().forEach((track) => track.stop());

      if (!mountedRef.current) return false;

      setPermissionState("granted");
      
      // Only show success toast if not on a restricted route
      if (!restricted) {
        toast.success("Microphone access granted", {
          id: "mic-permission-granted",
          duration: 2000
        });
      } else {
        console.log("[useRobustMicrophoneDetection] On restricted route, suppressing toast", {
          path: window.location.pathname
        });
      }
      
      // Don't set isLoading to false here, we'll do that after device detection
      return true;
    } catch (err) {
      console.error("[useRobustMicrophoneDetection] Microphone access denied:", err);

      if (!mountedRef.current) return false;

      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionState("denied");
        
        // Only show error toast if not on a restricted route
        if (!restricted) {
          toast.error("Microphone access denied", {
            description: "Please allow microphone access in your browser settings",
            id: "mic-permission-denied",
            duration: 3000
          });
        }
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        // Only show no microphone found toast if not on a restricted route
        if (!restricted) {
          toast.error("No microphone found", {
            description: "Please connect a microphone and try again",
            id: "no-microphone-found",
            duration: 3000
          });
        }
      }
      
      if (mountedRef.current) {
        // Keep isLoading false after error to allow UI to update
        setTimeout(() => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }, 1000);
      }
      
      return false;
    }
  }, [isRestrictedRoute]);

  /**
   * Detects audio devices
   */
  const detectDevices = useCallback(async (forceRefresh = false): Promise<{
    devices: AudioDevice[];
    defaultId: string | null;
  }> => {
    // Prevent multiple simultaneous detections
    if (detectionInProgressRef.current && !forceRefresh) {
      console.log("[useRobustMicrophoneDetection] Detection already in progress");
      return { devices, defaultId: devices.length > 0 ? devices[0].deviceId : null };
    }
    
    detectionInProgressRef.current = true;
    setIsLoading(true);
    
    if (forceRefresh) {
      setRefreshAttempts(prev => prev + 1);
    }

    try {
      // Check current permission state
      const permStatus = await checkPermissionStatus();
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }
      
      setPermissionState(permStatus);

      // If permission not granted, try to request it
      if (permStatus !== "granted") {
        const granted = await requestMicrophoneAccess();
        if (!granted || !mountedRef.current) {
          setIsLoading(false);
          detectionInProgressRef.current = false;
          return { devices: [], defaultId: null };
        }
      }

      // Now that we have permission, enumerate devices
      console.log("[useRobustMicrophoneDetection] Enumerating devices...");
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return { devices: [], defaultId: null };
      }

      const audioInputDevices = formatDevices(
        mediaDevices.filter((d) => d.kind === "audioinput")
      );
      
      console.log(`[useRobustMicrophoneDetection] Found ${audioInputDevices.length} audio inputs`);

      // Determine default device
      let defaultId = null;
      const defaultDevice = audioInputDevices.find(d => d.isDefault);
      
      if (defaultDevice) {
        defaultId = defaultDevice.deviceId;
      } else if (audioInputDevices.length > 0) {
        defaultId = audioInputDevices[0].deviceId;
      }

      setDevices(audioInputDevices);
      
      // Set isLoading to false after a short delay to ensure UI doesn't flash
      setTimeout(() => {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }, audioInputDevices.length > 0 ? 500 : 1500);
      
      return { devices: audioInputDevices, defaultId };
    } catch (err) {
      console.error("[useRobustMicrophoneDetection] Error detecting devices:", err);
      
      if (mountedRef.current) {
        setDevices([]);
        
        // Set isLoading to false after a delay
        setTimeout(() => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }, 1000);
      }
      
      return { devices: [], defaultId: null };
    } finally {
      if (mountedRef.current) {
        detectionInProgressRef.current = false;
      }
    }
  }, [checkPermissionStatus, requestMicrophoneAccess, formatDevices, devices]);

  // Initial detection and device change listener
  useEffect(() => {
    // Update isDashboardPage on mount
    isDashboardPage.current = isRestrictedRoute();
    
    // Create a proper event handler for devicechange events
    const handleDeviceChange = () => {
      console.log("[useRobustMicrophoneDetection] devicechange event detected");
      detectDevices(true).catch(console.error);
    };

    // Add listener for device changes
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    // Initial device detection
    detectDevices().catch(err => {
      console.error("[useRobustMicrophoneDetection] Initial detection failed:", err);
      // Ensure loading state is cleared after error
      if (mountedRef.current) {
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    });

    // Cleanup
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      cleanup();
    };
  }, [detectDevices, cleanup, isRestrictedRoute]);

  return {
    devices,
    isLoading,
    permissionState,
    refreshAttempts,
    detectDevices,
    requestMicrophoneAccess
  };
}
