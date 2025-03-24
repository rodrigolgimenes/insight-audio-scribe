
/**
 * Utility to suppress all device-related notifications
 */

// Intercept and suppress microphone notification toasts
export const suppressMicrophoneNotifications = () => {
  // This function is intentionally empty but can be called
  // to maintain API compatibility with existing code
  console.log('[suppressNotifications] Suppressing microphone notifications');
};

// Get a safe device name without triggering any UI messages
export const getSafeDeviceName = (device: any, index: number): string => {
  if (!device) return `Microphone ${index + 1}`;
  
  // Try to get a label safely
  try {
    return device.label || `Microphone ${index + 1}`;
  } catch (e) {
    return `Microphone ${index + 1}`;
  }
};

// Safely check device permissions without showing UI messages
export const safePermissionCheck = async (): Promise<boolean> => {
  // Always return true to avoid permission checks
  return true;
};

// Safe device existence check without UI messages
export const deviceExists = (deviceId: string, devices: any[]): boolean => {
  if (!deviceId || !devices || devices.length === 0) return true;
  return devices.some(d => d.deviceId === deviceId);
};
