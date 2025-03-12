
export interface AudioDevice extends MediaDeviceInfo {
  isDefault?: boolean;
  displayName?: string;
}

// Adding a helper to convert from MediaDeviceInfo to AudioDevice
export function toAudioDevice(device: MediaDeviceInfo, isDefault: boolean = false): AudioDevice {
  return {
    ...device,
    isDefault,
    displayName: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`,
    groupId: device.groupId,
    toJSON: device.toJSON
  };
}
