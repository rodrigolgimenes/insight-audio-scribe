import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo
} from "react";
import { toast } from "sonner";
import { AudioDevice } from "@/hooks/recording/capture/types";

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

interface DeviceManagerProviderProps {
  children: React.ReactNode;
}

const DeviceManagerContext = createContext<DeviceManagerContextValue | null>(null);

export function DeviceManagerProvider({ children }: DeviceManagerProviderProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [isLoading, setIsLoading] = useState(false);

  const detectionInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter(device => device.kind === "audioinput")
      .map((device, index) => {
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

  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log("[DeviceManagerContext] Explicitly requesting microphone permission");
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      stream.getTracks().forEach(track => track.stop());
      
      if (!mountedRef.current) return false;
      
      setPermissionState("granted");
      console.log("[DeviceManagerContext] Permission granted successfully");
      
      toast.success("Microphone access granted", {
        id: "mic-permission-granted",
        duration: 2000
      });
      
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Permission denied:", error);
      
      if (!mountedRef.current) return false;
      
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setPermissionState("denied");
        toast.error("Microphone access denied", {
          description: "Please allow microphone access in your browser settings",
          id: "mic-permission-denied",
          duration: 3000
        });
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        toast.error("No microphone found", {
          description: "Please connect a microphone and try again",
          id: "no-microphone-found",
          duration: 3000
        });
      }
      
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleSetSelectedDeviceId = useCallback((deviceId: string) => {
    console.log("[DeviceManagerContext] Setting selected device:", deviceId);
    
    const deviceExists = devices.some(d => d.deviceId === deviceId);
    console.log("[DeviceManagerContext] Device exists in list:", deviceExists);
    
    if (!deviceExists) {
      console.warn("[DeviceManagerContext] Selected device not in current device list!");
    }
    
    const previous = selectedDeviceId;
    
    setSelectedDeviceId(deviceId);
    
    console.log("[DeviceManagerContext] Device selection changed:", {
      from: previous,
      to: deviceId
    });
    
    setTimeout(() => {
      console.log("[DeviceManagerContext] Selection verification:", {
        expected: deviceId,
        actual: selectedDeviceId,
        match: selectedDeviceId === deviceId
      });
    }, 100);
  }, [devices, selectedDeviceId]);

  const refreshDevices = useCallback(async () => {
    if (detectionInProgressRef.current) {
      console.log("[DeviceManagerContext] refreshDevices: already in progress");
      return;
    }
    
    detectionInProgressRef.current = true;
    setIsLoading(true);
    console.log("[DeviceManagerContext] Starting device refresh...");

    try {
      if (navigator.permissions) {
        try {
          const permResult = await navigator.permissions.query({ name: "microphone" as PermissionName });
          console.log("[DeviceManagerContext] Permission status:", permResult.state);
          
          if (permResult.state !== "granted") {
            if (permResult.state === "denied") {
              setPermissionState("denied");
              console.log("[DeviceManagerContext] Permission already denied in browser settings");
              toast.error("Microphone access denied", {
                description: "Please allow microphone access in your browser settings",
                id: "mic-permission-browser-settings"
              });
              detectionInProgressRef.current = false;
              setIsLoading(false);
              return;
            }
            
            await requestPermission();
          } else {
            setPermissionState("granted");
          }
        } catch (err) {
          console.warn("[DeviceManagerContext] Error using Permissions API:", err);
        }
      }

      if (permissionState !== "granted") {
        console.log("[DeviceManagerContext] Requesting microphone access...");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          
          if (!mountedRef.current) {
            detectionInProgressRef.current = false;
            return;
          }
          
          setPermissionState("granted");
          console.log("[DeviceManagerContext] Microphone access granted");
        } catch (error) {
          console.error("[DeviceManagerContext] Error requesting permission:", error);
          
          if (!mountedRef.current) {
            detectionInProgressRef.current = false;
            return;
          }
          
          if (error instanceof DOMException && error.name === "NotAllowedError") {
            setPermissionState("denied");
            toast.error("Microphone access denied", {
              description: "Please allow microphone access in your browser settings"
            });
          }
          
          setDevices([]);
          detectionInProgressRef.current = false;
          setIsLoading(false);
          return;
        }
      }

      console.log("[DeviceManagerContext] Enumerating devices...");
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === "audioinput");
      const formattedDevices = formatDevices(audioInputs);

      console.log(`[DeviceManagerContext] Found ${formattedDevices.length} audio inputs:`, 
        formattedDevices.map(d => ({ id: d.deviceId, label: d.label })));
      
      if (!mountedRef.current) {
        detectionInProgressRef.current = false;
        return;
      }
      
      setDevices(formattedDevices);

      if (!selectedDeviceId && formattedDevices.length > 0) {
        const deviceToSelect = formattedDevices[0].deviceId;
        console.log("[DeviceManagerContext] Auto-selecting first device:", deviceToSelect);
        setSelectedDeviceId(deviceToSelect);
      } else if (selectedDeviceId) {
        const deviceExists = formattedDevices.some(d => d.deviceId === selectedDeviceId);
        if (!deviceExists && formattedDevices.length > 0) {
          const deviceToSelect = formattedDevices[0].deviceId;
          console.log("[DeviceManagerContext] Selected device no longer exists, selecting:", deviceToSelect);
          setSelectedDeviceId(deviceToSelect);
        }
      }
      
      if (formattedDevices.length === 0) {
        toast.warning("No microphones found", {
          description: "Please connect a microphone and try again"
        });
      }
    } catch (error) {
      console.error("[DeviceManagerContext] Error in refreshDevices:", error);
      if (mountedRef.current) {
        setDevices([]);
        setPermissionState("unknown");
        toast.error("Failed to detect microphones", {
          description: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        detectionInProgressRef.current = false;
      }
    }
  }, [permissionState, selectedDeviceId, formatDevices, requestPermission]);

  const setSelectedDeviceIdWithRouteAwareness = React.useCallback((deviceId: string) => {
    console.log('[DeviceManagerContext] Setting selected device ID:', deviceId);
    setSelectedDeviceId(deviceId);
    
    toast.success("Microphone selected", {
      id: "device-manager-selection",
      duration: 2000
    });
  }, []);

  const value: DeviceManagerContextValue = {
    devices,
    selectedDeviceId,
    setSelectedDeviceId: setSelectedDeviceIdWithRouteAwareness,
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

export function useDeviceManager() {
  const ctx = useContext(DeviceManagerContext);
  if (!ctx) {
    throw new Error("useDeviceManager must be used within a DeviceManagerProvider");
  }
  return ctx;
}
