
/**
 * Represents an audio input device with additional metadata.
 */
export interface AudioDevice {
  deviceId: string;
  label: string;
  groupId: string;
  kind: string;
  isDefault: boolean;
  index: number;
  displayName?: string;
  toJSON?: () => object;
}

/**
 * Converts a MediaDeviceInfo to an AudioDevice with additional properties.
 */
export function toAudioDevice(
  device: MediaDeviceInfo,
  isDefault: boolean = false,
  index: number = 0
): AudioDevice {
  return {
    deviceId: device.deviceId,
    label: device.label || `Microphone ${index + 1}`,
    groupId: device.groupId,
    kind: device.kind,
    isDefault,
    index,
    displayName: device.label || `Microphone ${index + 1}`,
    toJSON: () => ({
      deviceId: device.deviceId,
      label: device.label,
      groupId: device.groupId,
      kind: device.kind,
      isDefault,
      index
    })
  };
}

/**
 * Type for permission states
 */
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';
