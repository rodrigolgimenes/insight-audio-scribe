
import { AudioDevice } from "../recording/capture/types";

// Re-export types from recording/capture/types
export { AudioDevice } from "../recording/capture/types";

// Helper to convert from MediaDeviceInfo to AudioDevice with better naming
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
