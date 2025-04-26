
import { AudioDevice } from "@/hooks/recording/capture/types";

/**
 * Utilities for device detection and management
 */
export const deviceUtils = {
  /**
   * Get cached devices from localStorage
   */
  getCachedDevices(): AudioDevice[] {
    try {
      const cachedData = localStorage.getItem('audio_devices_cache');
      if (cachedData) {
        const devices = JSON.parse(cachedData);
        if (Array.isArray(devices) && devices.length > 0) {
          return devices;
        }
      }
    } catch (error) {
      console.error('[deviceUtils] Error loading cached devices:', error);
    }
    return [];
  },
  
  /**
   * Get cached selected device ID from localStorage
   */
  getCachedSelectedDeviceId(): string | null {
    try {
      return localStorage.getItem('audio_selected_device');
    } catch (error) {
      console.error('[deviceUtils] Error loading cached device ID:', error);
      return null;
    }
  },
  
  /**
   * Format MediaDeviceInfo array to AudioDevice array
   */
  formatDevices(mediaDevices: MediaDeviceInfo[]): AudioDevice[] {
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
  },
  
  /**
   * Check if devices are stale based on timestamp
   */
  areDevicesStale(lastDetectionTime: number, maxAgeMs = 60000): boolean {
    return Date.now() - lastDetectionTime > maxAgeMs;
  },
  
  /**
   * Simple utility to check if current page is a restricted route
   */
  isRestrictedRoute(): boolean {
    const path = window.location.pathname.toLowerCase();
    return path === '/' || 
           path === '/index' || 
           path === '/dashboard' || 
           path === '/app' ||
           path.startsWith('/app/');
  }
};
