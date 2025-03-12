
/**
 * Extended interface for audio devices with additional information
 */
export interface AudioDevice extends MediaDeviceInfo {
  /** A user-friendly display name for the device */
  displayName: string;
  /** Whether this is the default audio device */
  isDefault: boolean;
  /** The index of this device in the array of devices */
  index: number;
}

/**
 * Convert MediaDeviceInfo to AudioDevice with better naming
 */
export function toAudioDevice(device: MediaDeviceInfo, isDefault: boolean = false, index: number = 0): AudioDevice {
  return {
    ...device,
    isDefault,
    displayName: device.label || `Microphone ${index + 1}`,
    index,
    groupId: device.groupId,
    toJSON: device.toJSON
  };
}
