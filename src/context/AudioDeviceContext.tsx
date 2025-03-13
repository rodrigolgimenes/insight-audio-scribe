
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AudioDevice, PermissionState } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

interface AudioDeviceContextType {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
  permissionState: PermissionState;
  isLoading: boolean;
  refreshDevices: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

const AudioDeviceContext = createContext<AudioDeviceContextType | null>(null);

export function useAudioDevices() {
  const context = useContext(AudioDeviceContext);
  if (!context) {
    throw new Error("useAudioDevices must be used within an AudioDeviceProvider");
  }
  return context;
}

interface AudioDeviceProviderProps {
  children: ReactNode;
}

export function AudioDeviceProvider({ children }: AudioDeviceProviderProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const [isDashboard, setIsDashboard] = useState(false);

  // Improved check for restricted routes - dashboard/index/app paths
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);

  // Check if we're on the dashboard page
  useEffect(() => {
    const checkIfDashboard = () => {
      const restricted = isRestrictedRoute();
      setIsDashboard(restricted);
      console.log("[AudioDeviceContext] Route check:", {
        path: window.location.pathname,
        isRestricted: restricted
      });
    };
    
    checkIfDashboard();
    
    // Listen for route changes (simple approach that works without router access)
    const handleRouteChange = () => {
      checkIfDashboard();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isRestrictedRoute]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log("[AudioDeviceContext] Requesting microphone permission");
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately after permission is granted
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      console.log("[AudioDeviceContext] Permission granted");
      
      // Only show success toast if not on restricted route
      if (!isRestrictedRoute()) {
        toast.success("Microphone access granted", {
          duration: 2000
        });
      } else {
        console.log("[AudioDeviceContext] Suppressing success toast on restricted route");
      }
      
      return true;
    } catch (error) {
      console.error("[AudioDeviceContext] Permission denied:", error);
      setPermissionState("denied");
      
      // Only show error toast if not on restricted route
      if (!isRestrictedRoute()) {
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings"
        });
      } else {
        console.log("[AudioDeviceContext] Suppressing error toast on restricted route");
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isRestrictedRoute]);

  // Format devices from MediaDeviceInfo to our AudioDevice type
  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter(device => device.kind === "audioinput")
      .map((device, index) => {
        // If this is the first device or has "default" ID, mark as default
        const isDefault = device.deviceId === "default" || index === 0;
        return {
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
          groupId: device.groupId,
          kind: device.kind,
          isDefault,
          index
        };
      });
  }, []);

  // Refresh the list of audio devices
  const refreshDevices = useCallback(async (): Promise<void> => {
    console.log("[AudioDeviceContext] Refreshing devices");
    setIsLoading(true);
    
    try {
      // Check if permission already granted
      if (permissionState !== "granted") {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;
      }
      
      // Get devices with permission
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = formatDevices(
        mediaDevices.filter(d => d.kind === "audioinput")
      );
      
      console.log(`[AudioDeviceContext] Found ${audioInputDevices.length} audio input devices`);
      setDevices(audioInputDevices);
      
      // Auto-select first device if none selected
      if (!selectedDeviceId && audioInputDevices.length > 0) {
        console.log("[AudioDeviceContext] Auto-selecting first device:", audioInputDevices[0].deviceId);
        setSelectedDeviceId(audioInputDevices[0].deviceId);
      }
      
      // Only show toast for no devices error case when not on restricted route
      if (audioInputDevices.length === 0 && !isRestrictedRoute()) {
        toast.warning("No microphones found", {
          description: "Please connect a microphone and try again"
        });
      }
    } catch (error) {
      console.error("[AudioDeviceContext] Error refreshing devices:", error);
      
      // Only show error toast if not on restricted route
      if (!isRestrictedRoute()) {
        toast.error("Failed to refresh devices");
      }
    } finally {
      setIsLoading(false);
    }
  }, [permissionState, requestPermission, formatDevices, selectedDeviceId, isRestrictedRoute]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log("[AudioDeviceContext] Device change detected");
      refreshDevices();
    };
    
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    
    // Initial device detection
    refreshDevices();
    
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refreshDevices]);

  // Check permission status on mount
  useEffect(() => {
    const checkPermissionStatus = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          console.log("[AudioDeviceContext] Permission status:", result.state);
          setPermissionState(result.state as PermissionState);
          
          // Add listener for permission changes
          result.addEventListener("change", () => {
            console.log("[AudioDeviceContext] Permission state changed:", result.state);
            setPermissionState(result.state as PermissionState);
            if (result.state === "granted") {
              refreshDevices();
            }
          });
        } else {
          console.log("[AudioDeviceContext] Permissions API not available");
        }
      } catch (err) {
        console.error("[AudioDeviceContext] Error checking permission:", err);
      }
    };
    
    checkPermissionStatus();
  }, [refreshDevices]);

  const value = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    permissionState,
    isLoading,
    refreshDevices,
    requestPermission
  };

  return (
    <AudioDeviceContext.Provider value={value}>
      {children}
    </AudioDeviceContext.Provider>
  );
}
