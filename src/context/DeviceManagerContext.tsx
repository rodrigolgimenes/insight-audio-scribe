import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

type PermissionState = "prompt" | "granted" | "denied" | "unknown";

interface DeviceManagerContextValue {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
  permissionState: PermissionState;
  isLoading: boolean;
  refreshDevices: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

const DeviceManagerContext = createContext<DeviceManagerContextValue | null>(null);

export function useDeviceManager() {
  const context = useContext(DeviceManagerContext);
  if (!context) {
    throw new Error("useDeviceManager must be used within a DeviceManagerProvider");
  }
  return context;
}

interface DeviceManagerProviderProps {
  children: ReactNode;
}

export function DeviceManagerProvider({ children }: DeviceManagerProviderProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(false);

  // Log state changes to help with debugging
  useEffect(() => {
    console.log("[DeviceManagerContext] State update:", {
      devices: devices.length,
      selectedDeviceId,
      permissionState,
      isLoading
    });
  }, [devices, selectedDeviceId, permissionState, isLoading]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log("[DeviceManagerContext] Requesting microphone permission");
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately after permission is granted
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      console.log("[DeviceManagerContext] Permission granted");
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Permission denied:", error);
      setPermissionState("denied");
      toast.error("Microphone access denied", {
        description: "Please allow microphone access in your browser settings"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    console.log("[DeviceManagerContext] Refreshing devices");
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
      
      console.log(`[DeviceManagerContext] Found ${audioInputDevices.length} audio input devices`);
      setDevices(audioInputDevices);
      
      // Auto-select first device if none selected
      if (!selectedDeviceId && audioInputDevices.length > 0) {
        console.log("[DeviceManagerContext] Auto-selecting first device:", audioInputDevices[0].deviceId);
        setSelectedDeviceId(audioInputDevices[0].deviceId);
      }
      
      // Show toast with device count
      if (audioInputDevices.length === 0) {
        toast.warning("No microphones found", {
          description: "Please connect a microphone and try again"
        });
      } else {
        toast.success(`Found ${audioInputDevices.length} microphone(s)`, {
          duration: 2000
        });
      }
    } catch (error) {
      console.error("[DeviceManagerContext] Error refreshing devices:", error);
      toast.error("Failed to refresh devices");
    } finally {
      setIsLoading(false);
    }
  }, [permissionState, requestPermission, formatDevices, selectedDeviceId]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log("[DeviceManagerContext] Device change detected");
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
          console.log("[DeviceManagerContext] Permission status:", result.state);
          setPermissionState(result.state as PermissionState);
          
          // Add listener for permission changes
          result.addEventListener("change", () => {
            console.log("[DeviceManagerContext] Permission state changed:", result.state);
            setPermissionState(result.state as PermissionState);
            if (result.state === "granted") {
              refreshDevices();
            }
          });
        } else {
          console.log("[DeviceManagerContext] Permissions API not available");
        }
      } catch (err) {
        console.error("[DeviceManagerContext] Error checking permission:", err);
      }
    };
    
    checkPermissionStatus();
  }, [refreshDevices]);

  // Modifying setSelectedDeviceId to add more logging
  const handleDeviceSelect = useCallback((deviceId: string) => {
    console.log("[DeviceManagerContext] Setting selected device:", deviceId);
    
    // Validate device exists
    const deviceExists = devices.some(d => d.deviceId === deviceId);
    if (!deviceExists) {
      console.warn("[DeviceManagerContext] Selected device not found in current devices list");
    }
    
    setSelectedDeviceId(deviceId);
    
    // Verify state update with a delayed check
    setTimeout(() => {
      console.log("[DeviceManagerContext] Device selection verification:", {
        expected: deviceId,
        actual: selectedDeviceId,
        changed: deviceId === selectedDeviceId
      });
    }, 100);
  }, [devices, selectedDeviceId]);

  const value = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId: handleDeviceSelect,
    permissionState,
    isLoading,
    refreshDevices,
    requestPermission
  };

  return (
    <DeviceManagerContext.Provider value={value}>
      {children}
    </DeviceManagerContext.Provider>
  );
}
