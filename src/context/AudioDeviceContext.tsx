
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
      return true;
    } catch (error) {
      console.error("[AudioDeviceContext] Permission denied:", error);
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
      
      // Show toast only for no devices error case, removed success toast
      if (audioInputDevices.length === 0) {
        toast.warning("No microphones found", {
          description: "Please connect a microphone and try again"
        });
      }
    } catch (error) {
      console.error("[AudioDeviceContext] Error refreshing devices:", error);
      toast.error("Failed to refresh devices");
    } finally {
      setIsLoading(false);
    }
  }, [permissionState, requestPermission, formatDevices, selectedDeviceId]);

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
