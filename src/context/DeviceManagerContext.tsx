
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { PermissionState } from "@/hooks/recording/capture/permissions/types";
import { toast } from "sonner";
import { isRestrictedRoute } from "@/utils/route/isRestrictedRoute";

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
  
  // Refs para controle de notificações
  const hasShownPermissionNotificationRef = useRef(false);
  const hasShownNoDevicesNotificationRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string, description?: string) => {
    if (isRestrictedRoute()) {
      console.log('[DeviceManagerContext] Suppressing notification on restricted route:', message);
      return;
    }

    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message, { description });
    } else {
      toast.warning(message, { description });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log("[DeviceManagerContext] Requesting microphone permission");
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      
      if (!hasShownPermissionNotificationRef.current && !isInitialLoadRef.current) {
        hasShownPermissionNotificationRef.current = true;
        showNotification('success', "Microphone access granted");
      }
      
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Permission denied:", error);
      setPermissionState("denied");
      
      if (!hasShownPermissionNotificationRef.current && !isInitialLoadRef.current) {
        hasShownPermissionNotificationRef.current = true;
        showNotification('error', "Microphone access denied", 
          "Please allow microphone access in your browser settings");
      }
      
      return false;
    } finally {
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [showNotification]);

  const refreshDevices = useCallback(async (): Promise<boolean> => {
    console.log("[DeviceManagerContext] Refreshing devices");
    
    if (permissionState !== 'granted') {
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;
    }
    
    try {
      setIsLoading(true);
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === "audioinput");
      
      const formattedDevices = audioInputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        groupId: device.groupId,
        kind: device.kind,
        isDefault: device.deviceId === "default" || index === 0,
        index
      }));
      
      setDevices(formattedDevices);
      
      if (!selectedDeviceId && formattedDevices.length > 0) {
        setSelectedDeviceId(formattedDevices[0].deviceId);
      }
      
      if (formattedDevices.length === 0 && !hasShownNoDevicesNotificationRef.current && !isInitialLoadRef.current) {
        hasShownNoDevicesNotificationRef.current = true;
        showNotification('warning', "No microphones found", 
          "Please connect a microphone and try again");
      }
      
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Error refreshing devices:", error);
      return false;
    } finally {
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [permissionState, requestPermission, selectedDeviceId, showNotification]);

  // Setup device change listener and initial device check
  React.useEffect(() => {
    let isMounted = true;
    
    const handleDeviceChange = () => {
      console.log("[DeviceManagerContext] Device change detected");
      if (isMounted && permissionState === 'granted') {
        refreshDevices();
      }
    };
    
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    
    // Initial permission check
    const checkInitialPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          
          if (isMounted) {
            console.log("[DeviceManagerContext] Initial permission status:", result.state);
            setPermissionState(result.state as PermissionState);
            
            if (result.state === 'granted') {
              refreshDevices();
            }
            
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
