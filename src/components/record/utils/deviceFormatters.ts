
import { AudioDevice } from "@/hooks/recording/capture/types";

/**
 * Format device label to be more readable
 */
export function formatDeviceLabel(device: MediaDeviceInfo | AudioDevice, index: number): string {
  if (!device) return `Microphone ${index + 1}`;
  
  // Check if label is available and not empty
  if (device.label && device.label.trim() !== '') {
    return device.label;
  }
  
  // If AudioDevice, check displayName
  if ('displayName' in device && device.displayName && device.displayName.trim() !== '') {
    return device.displayName;
  }
  
  // Fall back to a numbered microphone if no label is available
  return `Microphone ${index + 1}`;
}
