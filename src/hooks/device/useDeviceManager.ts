import { useEffect, useState, useCallback } from "react";
import { AudioDevice } from "../recording/capture/types";
import { toast } from "sonner";

// Constants
const STORAGE_KEYS = {
  SELECTED_DEVICE: 'audio_selected_device',
  DEVICES_CACHE: 'audio_devices_cache',
  LAST_DETECTION: 'audio_last_detection_time'
};

const CACHE_MAX_AGE = 60000; // 1 minute cache validity
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
      toast.success("Microphone access granted", {
        id: 'mic-permission-granted',
        duration: 3000
      });
      return true;
    } catch (error) {
      setPermissionState('denied');
      toast.error("Microphone access denied", {
        id: 'mic-permission-denied',
        duration: 5000
      });
      return false;
    }
  }, [isLoading]);

  // Refresh devices list with improved notification handling
  const refreshDevices = useCallback(async (force = false): Promise<boolean> => {
    if (isLoading && !force) return false;
    
    setIsLoading(true);
    
    try {
      // Ensure permission is granted
      if (permissionState !== 'granted') {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          setIsLoading(false);
          return false;
        }
      }
      
      // Get devices
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = formatDevices(mediaDevices);
      
      // Update state and cache
      setDevices(audioDevices);
      localStorage.setItem(STORAGE_KEYS.DEVICES_CACHE, JSON.stringify(audioDevices));
      localStorage.setItem(STORAGE_KEYS.LAST_DETECTION, Date.now().toString());
      
      // Clear "no devices" notification if we found devices
      if (audioDevices.length > 0) {
        toast.dismiss('no-devices');
      } else {
        // Only show no devices warning if we don't already have one showing
        toast.warning("No microphones found", {
          id: 'no-devices',
          duration: 5000
        });
      }
      
      // Auto-select first device if none selected
      if (!selectedDeviceId && audioDevices.length > 0) {
        const defaultDevice = audioDevices.find(d => d.isDefault) || audioDevices[0];
        handleSelectDevice(defaultDevice.deviceId);
      }
      
      return true;
    } catch (error) {
      console.error('[DeviceManager] Error refreshing devices:', error);
      toast.error("Failed to refresh devices", {
        id: 'refresh-error',
        duration: 5000
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, permissionState, requestPermission, formatDevices, selectedDeviceId]);

  // Handle device selection with improved notification
  const handleSelectDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem(STORAGE_KEYS.SELECTED_DEVICE, deviceId);
    
    const deviceLabel = devices.find(d => d.deviceId === deviceId)?.label || 'Microphone';
    toast.success(`Selected ${deviceLabel}`, {
      id: 'device-selected',
      duration: 2000
    });
  }, [devices]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const hasCachedData = loadFromCache();
      
      // Check if we need to refresh
      const lastDetection = localStorage.getItem(STORAGE_KEYS.LAST_DETECTION);
      const cacheExpired = !lastDetection || Date.now() - parseInt(lastDetection, 10) > CACHE_MAX_AGE;
      
      if (!hasCachedData || cacheExpired) {
        await refreshDevices(false);
      }
    };
    
    init();
  }, [loadFromCache, refreshDevices]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => refreshDevices(true);
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
