
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { PermissionState } from "@/hooks/recording/capture/permissions/types";
import { toast } from "sonner";

interface DeviceManagerContextValue {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
  permissionState: PermissionState;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  refreshDevices: () => Promise<boolean>;
}

const DeviceManagerContext = createContext<DeviceManagerContextValue | null>(null);

export function DeviceManagerProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs to prevent duplicate notifications
  const permissionCheckingRef = useRef(false);
  const hasShownPermissionNotificationRef = useRef(false);
  const hasShownNoDevicesNotificationRef = useRef(false);
  
  // Check if we're on a restricted route (dashboard, index, app)
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);

  // Request microphone permission - SIMPLIFIED VERSION
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (permissionCheckingRef.current) {
      console.log("[DeviceManagerContext] Permission check already in progress, skipping duplicate request");
      return permissionState === 'granted';
    }
    
    console.log("[DeviceManagerContext] Requesting microphone permission");
    permissionCheckingRef.current = true;
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      console.log("[DeviceManagerContext] Permission granted");
      
      // Only show notification if permission was not previously granted and not on a restricted route
      if (permissionState !== 'granted' && !isRestrictedRoute() && !hasShownPermissionNotificationRef.current) {
        hasShownPermissionNotificationRef.current = true;
        toast.success("Microphone access granted", {
          duration: 2000,
          id: "mic-permission-granted" // Use ID to prevent duplicates
        });
      }
      
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Permission denied:", error);
      setPermissionState("denied");
      
      // Only show error toast if not on restricted route and hasn't been shown before
      if (!isRestrictedRoute() && !hasShownPermissionNotificationRef.current) {
        hasShownPermissionNotificationRef.current = true;
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings",
          id: "mic-permission-denied" // Use ID to prevent duplicates
        });
      }
      
      return false;
    } finally {
      setIsLoading(false);
      permissionCheckingRef.current = false;
    }
  }, [permissionState, isRestrictedRoute]);

  // Refresh devices with simplified logic
  const refreshDevices = useCallback(async (): Promise<boolean> => {
    console.log("[DeviceManagerContext] Refreshing devices");
    
    // If permission not granted, request it first
    if (permissionState !== 'granted') {
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;
    }
    
    try {
      setIsLoading(true);
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === "audioinput");
      
      // Format devices
      const formattedDevices = audioInputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        groupId: device.groupId,
        kind: device.kind,
        isDefault: device.deviceId === "default" || index === 0,
        index
      }));
      
      setDevices(formattedDevices);
      
      // Auto-select first device if none selected
      if (!selectedDeviceId && formattedDevices.length > 0) {
        setSelectedDeviceId(formattedDevices[0].deviceId);
      }
      
      // Only show no devices error if none found and not on restricted route
      if (formattedDevices.length === 0 && !isRestrictedRoute() && !hasShownNoDevicesNotificationRef.current) {
        hasShownNoDevicesNotificationRef.current = true;
        toast.warning("No microphones found", {
          description: "Please connect a microphone and try again",
          id: "no-mics-found" // Use ID to prevent duplicates
        });
      }
      
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Error refreshing devices:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [permissionState, requestPermission, selectedDeviceId, isRestrictedRoute]);

  // Setup device change listener and initial device check
  React.useEffect(() => {
    let isMounted = true;
    
    // Listen for device changes
    const handleDeviceChange = () => {
      console.log("[DeviceManagerContext] Device change detected");
      if (isMounted && permissionState === 'granted') {
        refreshDevices();
      }
    };
    
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    
    // Initial permission check only on component mount
    const checkInitialPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          
          if (isMounted) {
            console.log("[DeviceManagerContext] Initial permission status:", result.state);
            setPermissionState(result.state as PermissionState);
            
            // If permission already granted, refresh devices
            if (result.state === 'granted') {
              refreshDevices();
            }
            
            // Add listener for permission changes
            result.addEventListener("change", () => {
              if (isMounted) {
                console.log("[DeviceManagerContext] Permission state changed:", result.state);
                setPermissionState(result.state as PermissionState);
                
                if (result.state === 'granted') {
                  refreshDevices();
                }
              }
            });
          }
        }
      } catch (error) {
        console.log("[DeviceManagerContext] Permissions API not available or error:", error);
      }
    };
    
    // Run initial check (don't make it async to avoid race conditions)
    checkInitialPermission();
    
    return () => {
      isMounted = false;
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refreshDevices, permissionState]);

  const value = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    permissionState,
    isLoading,
    requestPermission,
    refreshDevices
  };

  return (
    <DeviceManagerContext.Provider value={value}>
      {children}
    </DeviceManagerContext.Provider>
  );
}

export function useDeviceManager() {
  const ctx = useContext(DeviceManagerContext);
  if (!ctx) {
    throw new Error("useDeviceManager must be used within a DeviceManagerProvider");
  }
  return ctx;
}
