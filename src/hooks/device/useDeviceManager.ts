
import { useEffect, useState, useCallback } from "react";
import { AudioDevice } from "../recording/capture/types";
import { toast } from "sonner";

// Singleton state storage
const deviceState = {
  devices: [] as AudioDevice[],
  selectedDeviceId: null as string | null,
  permissionState: 'unknown' as 'prompt' | 'granted' | 'denied' | 'unknown',
  isLoading: false,
  initialized: false,
  lastDetectionTime: 0,
  cachedDevices: [] as AudioDevice[]
};

// Local storage keys
const STORAGE_KEYS = {
  SELECTED_DEVICE: 'audio_selected_device',
  DEVICES_CACHE: 'audio_devices_cache',
  LAST_DETECTION: 'audio_last_detection_time'
};

// Load cached data from localStorage
const loadFromCache = () => {
  try {
    // Load selected device ID
    const savedDeviceId = localStorage.getItem(STORAGE_KEYS.SELECTED_DEVICE);
    if (savedDeviceId) {
      deviceState.selectedDeviceId = savedDeviceId;
    }
    
    // Load cached devices
    const cachedDevicesStr = localStorage.getItem(STORAGE_KEYS.DEVICES_CACHE);
    if (cachedDevicesStr) {
      const cachedDevices = JSON.parse(cachedDevicesStr);
      if (Array.isArray(cachedDevices) && cachedDevices.length > 0) {
        deviceState.cachedDevices = cachedDevices;
      }
    }
    
    // Load detection timestamp
    const lastDetection = localStorage.getItem(STORAGE_KEYS.LAST_DETECTION);
    if (lastDetection) {
      deviceState.lastDetectionTime = parseInt(lastDetection, 10);
    }
  } catch (error) {
    console.error('[DeviceManager] Error loading from cache:', error);
  }
};

// Initialize cache on load
loadFromCache();

/**
 * Optimized hook for accessing and managing audio devices
 */
export function useDeviceManager() {
  // Local state that will sync with the singleton
  const [devices, setDevices] = useState<AudioDevice[]>(deviceState.devices);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(deviceState.selectedDeviceId);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>(deviceState.permissionState);
  const [isLoading, setIsLoading] = useState(deviceState.isLoading);

  // Check if we're on a restricted route
  const isRestrictedRoute = useCallback((): boolean => {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }, []);

  // Format devices from MediaDeviceInfo to AudioDevice
  const formatDevices = useCallback((mediaDevices: MediaDeviceInfo[]): AudioDevice[] => {
    return mediaDevices
      .filter(device => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
        groupId: device.groupId,
        kind: device.kind,
        isDefault: device.deviceId === "default" || index === 0,
        index
      }));
  }, []);

  // Display notification based on route restrictions
  const showNotification = useCallback((
    type: 'success' | 'error' | 'warning', 
    message: string, 
    description?: string,
    id?: string
  ) => {
    if (isRestrictedRoute()) {
      console.log('[DeviceManager] Suppressing notification on restricted route:', message);
      return;
    }

    if (type === 'success') {
      toast.success(message, { id });
    } else if (type === 'error') {
      toast.error(message, { description, id });
    } else {
      toast.warning(message, { description, id });
    }
  }, [isRestrictedRoute]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // If already loading, return current state
    if (deviceState.isLoading) {
      return deviceState.permissionState === 'granted';
    }
    
    // If permission already granted and recently checked, return early
    if (deviceState.permissionState === 'granted' && 
        Date.now() - deviceState.lastDetectionTime < 60000) {
      return true;
    }
    
    console.log("[DeviceManager] Requesting microphone permission");
    deviceState.isLoading = true;
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      const newPermissionState = 'granted';
      deviceState.permissionState = newPermissionState;
      setPermissionState(newPermissionState);
      
      showNotification('success', "Microphone access granted", undefined, 'mic-permission');
      return true;
    } catch (error) {
      console.error("[DeviceManager] Permission denied:", error);
      
      const newPermissionState = 'denied';
      deviceState.permissionState = newPermissionState;
      setPermissionState(newPermissionState);
      
      showNotification('error', "Microphone access denied", 
        "Please allow microphone access in your browser settings", 'mic-permission-denied');
      return false;
    } finally {
      deviceState.isLoading = false;
      setIsLoading(false);
    }
  }, [showNotification]);

  // Refresh device list with optimized caching
  const refreshDevices = useCallback(async (forceRefresh = false): Promise<boolean> => {
    // Skip if already loading
    if (deviceState.isLoading && !forceRefresh) {
      return false;
    }
    
    // Use cached devices if available and not forced refresh
    const now = Date.now();
    const cacheMaxAge = 60000; // 1 minute cache validity
    const cacheIsValid = now - deviceState.lastDetectionTime < cacheMaxAge;
    
    if (!forceRefresh && cacheIsValid && deviceState.devices.length > 0) {
      console.log('[DeviceManager] Using cached devices, age:', (now - deviceState.lastDetectionTime) / 1000, 'seconds');
      return true;
    }
    
    console.log("[DeviceManager] Refreshing devices" + (forceRefresh ? ' (forced)' : ''));
    deviceState.isLoading = true;
    setIsLoading(true);
    
    try {
      // Ensure permission is granted first if needed
      if (deviceState.permissionState !== 'granted') {
        const hasPermission = await requestPermission();
        if (!hasPermission) return false;
      }
      
      // Get devices with permission
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = formatDevices(mediaDevices.filter(d => d.kind === "audioinput"));
      
      console.log(`[DeviceManager] Found ${audioDevices.length} audio devices`);
      
      // Update singleton state
      deviceState.devices = audioDevices;
      deviceState.lastDetectionTime = now;
      
      // Save to state and cache
      setDevices(audioDevices);
      localStorage.setItem(STORAGE_KEYS.LAST_DETECTION, now.toString());
      localStorage.setItem(STORAGE_KEYS.DEVICES_CACHE, JSON.stringify(audioDevices));
      
      // Auto-select first device if none selected
      if (!deviceState.selectedDeviceId && audioDevices.length > 0) {
        const defaultDevice = audioDevices.find(d => d.isDefault) || audioDevices[0];
        deviceState.selectedDeviceId = defaultDevice.deviceId;
        setSelectedDeviceId(defaultDevice.deviceId);
        localStorage.setItem(STORAGE_KEYS.SELECTED_DEVICE, defaultDevice.deviceId);
      }
      
      // Check if selected device still exists
      if (deviceState.selectedDeviceId && !audioDevices.some(d => d.deviceId === deviceState.selectedDeviceId) && audioDevices.length > 0) {
        const newDeviceId = audioDevices[0].deviceId;
        deviceState.selectedDeviceId = newDeviceId;
        setSelectedDeviceId(newDeviceId);
        localStorage.setItem(STORAGE_KEYS.SELECTED_DEVICE, newDeviceId);
      }
      
      // Show notification if no devices found
      if (audioDevices.length === 0) {
        showNotification('warning', "No microphones found", 
          "Please connect a microphone and try again", 'no-mics');
      }
      
      return true;
    } catch (error) {
      console.error("[DeviceManager] Error refreshing devices:", error);
      showNotification('error', "Failed to refresh devices");
      return false;
    } finally {
      deviceState.isLoading = false;
      setIsLoading(false);
      deviceState.initialized = true;
    }
  }, [requestPermission, formatDevices, showNotification]);

  // Handle device selection
  const handleSelectDevice = useCallback((deviceId: string) => {
    console.log('[DeviceManager] Selecting device:', deviceId);
    
    // Update singleton state
    deviceState.selectedDeviceId = deviceId;
    setSelectedDeviceId(deviceId);
    
    // Save to local storage
    localStorage.setItem(STORAGE_KEYS.SELECTED_DEVICE, deviceId);
    
    // Show notification
    showNotification('success', "Microphone selected", undefined, 'mic-selected');
  }, [showNotification]);

  // Initialize on mount - fast startup with cached data
  useEffect(() => {
    const initDevices = async () => {
      // Fast initialization with cached data
      if (deviceState.cachedDevices.length > 0) {
        console.log('[DeviceManager] Using cached devices for initial render');
        setDevices(deviceState.cachedDevices);
      }
      
      // Check if we need to initialize
      if (!deviceState.initialized) {
        await refreshDevices(false);
      }
    };
    
    initDevices();
    
    // Listen for device changes
    const handleDeviceChange = () => {
      console.log("[DeviceManager] Device change detected");
      refreshDevices(true);
    };
    
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refreshDevices]);

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          
          const newPermissionState = result.state as 'prompt' | 'granted' | 'denied';
          deviceState.permissionState = newPermissionState;
          setPermissionState(newPermissionState);
          
          // Listen for permission changes
          result.addEventListener("change", () => {
            const changedState = result.state as 'prompt' | 'granted' | 'denied';
            deviceState.permissionState = changedState;
            setPermissionState(changedState);
            
            if (changedState === 'granted') {
              refreshDevices(true);
            }
          });
          
          // If permission is granted, ensure we have devices
          if (result.state === 'granted' && devices.length === 0) {
            refreshDevices(false);
          }
        }
      } catch (error) {
        console.log("[DeviceManager] Permissions API error:", error);
      }
    };
    
    checkPermission();
  }, [devices.length, refreshDevices]);

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId: handleSelectDevice,
    permissionState,
    isLoading,
    refreshDevices,
    requestPermission
  };
}
