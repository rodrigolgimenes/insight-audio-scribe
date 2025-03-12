
export interface AudioDevice extends MediaDeviceInfo {
  isDefault?: boolean;
  displayName: string; // Make this required
  index?: number;
}

// Helper to convert from MediaDeviceInfo to AudioDevice with better naming
export function toAudioDevice(device: MediaDeviceInfo, isDefault: boolean = false, index: number = 0): AudioDevice {
  // Create a proper display name
  let displayName = '';
  
  if (device.label && device.label.trim() !== '') {
    // Use the actual label if available
    displayName = device.label;
  } else {
    // Fall back to a numbered microphone if no label is available
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
