
import { useEffect } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { RecordingValidator } from "@/utils/audio/recordingValidator";

/**
 * Hook for validating device selection and logging diagnostics
 */
export const useDeviceValidation = (
  selectedDeviceId: string | null,
  audioDevices: AudioDevice[],
  deviceSelectionReady: boolean,
  permissionGranted: boolean
) => {
  // Log diagnostics when key values change
  useEffect(() => {
    RecordingValidator.logDiagnostics({
      selectedDeviceId,
      deviceSelectionReady,
      audioDevices,
      isRecording: false,
      permissionsGranted: permissionGranted
    });
  }, [selectedDeviceId, audioDevices, deviceSelectionReady, permissionGranted]);

  // Check if selected device exists in the device list
  const validateDeviceExists = (deviceId: string | null) => {
    if (!deviceId) return false;
    return audioDevices.some(device => device.deviceId === deviceId);
  };

  return {
    validateDeviceExists,
    logDiagnostics: RecordingValidator.logDiagnostics
  };
};
