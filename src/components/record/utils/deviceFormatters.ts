import { AudioDevice } from "@/hooks/recording/capture/types";

/**
 * Formats a device label to be user friendly
 */
export function formatDeviceLabel(device: AudioDevice | MediaDeviceInfo, index: number = 0): string {
  // Default device name if no label provided
  let defaultName = `Microphone ${index + 1}`;
  
  // Handle different device object types
  if (!device) {
    return defaultName;
  }
  
  // Extract label based on device type
  const label = typeof device === 'object' && 'label' in device && typeof device.label === 'string' 
    ? device.label.trim() 
    : defaultName;
  
  // If there's no label or it's empty, return the default
  if (!label || label === '') {
    return defaultName;
  }
  
  // Format label - remove excess noise
  const formatted = label
    .replace(/\(.*?\)/g, '') // Remove parentheses and their contents
    .replace(/- [^-]*$/, '') // Remove everything after last dash
    .trim();
  
  return formatted || defaultName;
}

/**
 * Formats a device ID for display purposes
 */
export function formatDeviceId(deviceId: string): string {
  if (!deviceId) return 'No device ID';
  
  // If it's a default device marker, show that
  if (deviceId === 'default') return 'Default Device';
  
  // Otherwise, truncate it to make it readable
  return deviceId.substring(0, 8) + '...';
}
