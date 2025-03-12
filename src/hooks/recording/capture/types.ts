
export interface AudioDevice extends MediaDeviceInfo {
  isDefault?: boolean;
  displayName?: string;
  index?: number;
}

// Helper to convert from MediaDeviceInfo to AudioDevice with better naming
export function toAudioDevice(device: MediaDeviceInfo, isDefault: boolean = false, index: number = 0): AudioDevice {
  // Create a proper display name
  let displayName = '';
  
  if (device.label && device.label.trim() !== '') {
    displayName = device.label;
  } else {
    displayName = `Microphone ${index + 1}`;
  }

  return {
    ...device,
    isDefault,
    displayName,
    index,
    groupId: device.groupId,
    toJSON: device.toJSON
  };
}
