
import { AudioDevice } from "@/hooks/recording/capture/types";

/**
 * Converts a MediaDeviceInfo to an AudioDevice
 */
export const toAudioDevice = (
  device: MediaDeviceInfo,
  isDefault: boolean = false,
  index: number = 0
): AudioDevice => {
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
};
