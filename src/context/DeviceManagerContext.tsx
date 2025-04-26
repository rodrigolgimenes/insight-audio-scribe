
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
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
  
  // Refs for notification control and state management
  const hasShownPermissionNotificationRef = useRef(false);
  const hasShownNoDevicesNotificationRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const mountedRef = useRef(true);
  const lastRefreshTimeRef = useRef(0);
  
  // Check if we're on a restricted route
  const isRestrictedRoute = useCallback(() => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);
  
  // Handle component mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Centralized notification handler
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string, description?: string) => {
    // Suppress notifications on restricted routes
    if (isRestrictedRoute()) {
      console.log('[DeviceManagerContext] Suppressing notification on restricted route:', message);
      return;
    }

    // Only show notification if we're past initial load
    if (isInitialLoadRef.current) {
      console.log('[DeviceManagerContext] Suppressing notification during initial load:', message);
      return;
    }

    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message, { description });
    } else {
      toast.warning(message, { description });
    }
  }, [isRestrictedRoute]);

  // Permission request handler
  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log("[DeviceManagerContext] Requesting microphone permission");
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      if (!mountedRef.current) return false;
      
      setPermissionState("granted");
      
      // Show notification only once and not on initial load
      if (!hasShownPermissionNotificationRef.current && !isInitialLoadRef.current) {
        hasShownPermissionNotificationRef.current = true;
        showNotification('success', "Microphone access granted");
      }
      
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Permission denied:", error);
      
      if (!mountedRef.current) return false;
      
      setPermissionState("denied");
      
      // Show notification only once and not on initial load
      if (!hasShownPermissionNotificationRef.current && !isInitialLoadRef.current) {
        hasShownPermissionNotificationRef.current = true;
        showNotification('error', "Microphone access denied", 
          "Please allow microphone access in your browser settings");
      }
      
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [showNotification]);

  // Device refresh handler with rate limiting
  const refreshDevices = useCallback(async (): Promise<boolean> => {
    console.log("[DeviceManagerContext] Refreshing devices");
    
    // Rate limiting - don't refresh too frequently
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000 && devices.length > 0) {
      console.log("[DeviceManagerContext] Skipping refresh - too soon since last refresh");
      return true;
    }
    
    lastRefreshTimeRef.current = now;
    
    // Ensure permission is granted first
    if (permissionState !== 'granted') {
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;
    }
    
    try {
      setIsLoading(true);
      
      if (!mountedRef.current) return false;
      
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
      
      if (!mountedRef.current) return false;
      
      setDevices(formattedDevices);
      
      // Auto-select first device if none selected
      if (!selectedDeviceId && formattedDevices.length > 0) {
        setSelectedDeviceId(formattedDevices[0].deviceId);
      }
      
      // Show notification if no devices found, but only once per session and not during initial load
      if (formattedDevices.length === 0 && !hasShownNoDevicesNotificationRef.current && !isInitialLoadRef.current) {
        hasShownNoDevicesNotificationRef.current = true;
        showNotification('warning', "No microphones found", 
          "Please connect a microphone and try again");
      }
      
      // Clear initial load flag after first successful refresh
      isInitialLoadRef.current = false;
      
      return true;
    } catch (error) {
      console.error("[DeviceManagerContext] Error refreshing devices:", error);
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        
        // Clear initial load flag after first attempt, even if it failed
        isInitialLoadRef.current = false;
      }
    }
  }, [devices.length, permissionState, requestPermission, selectedDeviceId, showNotification]);

  // Set up device change listener and initial device check
  useEffect(() => {
    // Only run this once
    const handleDeviceChange = () => {
      console.log("[DeviceManagerContext] Device change detected");
      if (mountedRef.current && permissionState === 'granted') {
        refreshDevices();
      }
    };
    
    // Add device change listener
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    
    // Initial permission check
    const checkInitialPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          
          if (!mountedRef.current) return;
          
          console.log("[DeviceManagerContext] Initial permission status:", result.state);
          setPermissionState(result.state as PermissionState);
          
          // If permission is granted, refresh devices
          if (result.state === 'granted') {
            refreshDevices();
          }
          
          // Listen for permission changes
          result.addEventListener("change", () => {
            if (!mountedRef.current) return;
            
            console.log("[DeviceManagerContext] Permission state changed:", result.state);
            setPermissionState(result.state as PermissionState);
            
            // If permission becomes granted, refresh devices
            if (result.state === 'granted') {
              refreshDevices();
            }
          });
        }
      } catch (error) {
        console.log("[DeviceManagerContext] Permissions API not available or error:", error);
      }
    };
    
    // Run initial permission check
    checkInitialPermission();
    
    return () => {
      // Clean up on unmount
      mountedRef.current = false;
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
