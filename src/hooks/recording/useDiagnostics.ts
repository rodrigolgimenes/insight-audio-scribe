
import { useEffect } from "react";
import { RecordingValidator } from "@/utils/audio/recordingValidator";
import { AudioDevice } from "@/hooks/recording/capture/types";

export const useDiagnostics = ({
  selectedDeviceId,
  deviceSelectionReady,
  audioDevices,
  isRecording
}: {
  selectedDeviceId: string | null;
  deviceSelectionReady: boolean;
  audioDevices: AudioDevice[];
  isRecording: boolean;
}) => {
  // Log diagnostic information when key props change
  useEffect(() => {
    RecordingValidator.logDiagnostics({
      selectedDeviceId,
      deviceSelectionReady,
      audioDevices,
      isRecording
    });
  }, [isRecording, deviceSelectionReady, selectedDeviceId, audioDevices]);

  return {
    logDiagnostics: RecordingValidator.logDiagnostics
  };
};
