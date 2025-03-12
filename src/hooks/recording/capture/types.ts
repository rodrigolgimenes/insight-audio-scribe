
/**
 * Extended AudioDevice type that includes additional properties
 */
export interface AudioDevice extends MediaDeviceInfo {
  isDefault: boolean;
  displayName: string;
  index: number;
}

/**
 * Helper to convert from MediaDeviceInfo to AudioDevice with better naming
 */
export function toAudioDevice(device: MediaDeviceInfo, isDefault: boolean = false, index: number = 0): AudioDevice {
  return {
    deviceId: device.deviceId,
    groupId: device.groupId,
    kind: device.kind,
    label: device.label,
    isDefault,
    displayName: device.label || `Microphone ${index + 1}`,
    index,
    toJSON: device.toJSON
  };
}
