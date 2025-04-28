import { useEffect, useState, useCallback } from "react";
import { AudioDevice } from "../recording/capture/types";
import { toast } from "sonner";
import { isRestrictedRoute } from "@/utils/route/isRestrictedRoute";

// Constants
const STORAGE_KEYS = {
  SELECTED_DEVICE: 'audio_selected_device',
  DEVICES_CACHE: 'audio_devices_cache',
  LAST_DETECTION: 'audio_last_detection_time'
};

const CACHE_MAX_AGE = 60000; // 1 minute cache validity

// Set to keep track of notification IDs that have been shown
// This prevents duplicate notifications
const notifiedEvents = new Set<string>();

export function useDeviceManager() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(false);

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

  // Load cached data
  const loadFromCache = useCallback(() => {
    try {
      // Load selected device ID
      const savedDeviceId = localStorage.getItem(STORAGE_KEYS.SELECTED_DEVICE);
      if (savedDeviceId) {
        setSelectedDeviceId(savedDeviceId);
      }

      // Load cached devices
      const cachedDevicesStr = localStorage.getItem(STORAGE_KEYS.DEVICES_CACHE);
      if (cachedDevicesStr) {
        const cachedDevices = JSON.parse(cachedDevicesStr);
        if (Array.isArray(cachedDevices) && cachedDevices.length > 0) {
          setDevices(cachedDevices);
          return true;
        }
      }
    } catch (error) {
      console.error('[DeviceManager] Error loading from cache:', error);
    }
    return false;
  }, []);

  // Request microphone permission with improved notification handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isLoading) return false;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState('granted');
      
      if (!isRestrictedRoute() && !notifiedEvents.has('mic-permission-granted')) {
        notifiedEvents.add('mic-permission-granted');
        toast.success("Microphone access granted", {
          id: 'mic-permission-granted',
          duration: 3000
        });
      }
      
      return true;
    } catch (error) {
      setPermissionState('denied');
      
      if (!isRestrictedRoute() && !notifiedEvents.has('mic-permission-denied')) {
        notifiedEvents.add('mic-permission-denied');
        toast.error("Microphone access denied", {
          id: 'mic-permission-denied',
          duration: 5000
        });
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Refresh devices list with improved notification handling
  const refreshDevices = useCallback(async (showNotifications = false): Promise<boolean> => {
    if (isLoading) return false;
    
    setIsLoading(true);
    
    try {
      if (permissionState !== 'granted') {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          setIsLoading(false);
          return false;
        }
      }
      
      const raw = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = formatDevices(raw);
      setDevices(audioInputs);

      // Skip notifications always - we no longer show device-related notifications
      // as they were causing UX issues
      
      // Auto-select first device if none selected
      if (!selectedDeviceId && audioInputs.length > 0) {
        const defaultDevice = audioInputs.find(d => d.isDefault) || audioInputs[0];
        handleSelectDevice(defaultDevice.deviceId);
      }
      
      localStorage.setItem(STORAGE_KEYS.DEVICES_CACHE, JSON.stringify(audioInputs));
      localStorage.setItem(STORAGE_KEYS.LAST_DETECTION, Date.now().toString());
      
      return true;
    } catch (error) {
      console.error('[DeviceManager] Error refreshing devices:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, permissionState, requestPermission, formatDevices, selectedDeviceId]);

  // Handle device selection with improved notification
  const handleSelectDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem(STORAGE_KEYS.SELECTED_DEVICE, deviceId);
    
    const notificationId = 'device-selected';
    if (!isRestrictedRoute()) {
      const deviceLabel = devices.find(d => d.deviceId === deviceId)?.label || 'Microphone';
      
      toast.dismiss(notificationId);
      
      toast.success(`Selected ${deviceLabel}`, {
        id: notificationId,
        duration: 2000
      });
    }
  }, [devices]);

  // Initialize on mount - silent refresh
  useEffect(() => {
    const init = async () => {
      const hasCachedData = loadFromCache();
      
      const lastDetection = localStorage.getItem(STORAGE_KEYS.LAST_DETECTION);
      const cacheExpired = !lastDetection || Date.now() - parseInt(lastDetection, 10) > CACHE_MAX_AGE;
      
      // Only refresh devices on mount if cache is expired and we're not on a restricted route
      // This prevents unnecessary microphone permission prompts on pages like Index
      if ((!hasCachedData || cacheExpired) && !isRestrictedRoute()) {
        await refreshDevices(false);
      }
    };
    
    init();
  }, [loadFromCache, refreshDevices]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      // Only refresh with notifications if we're on a non-restricted route
      if (!isRestrictedRoute()) {
        refreshDevices(true);
      }
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

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
