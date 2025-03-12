
import { useDeviceManagement } from "./useDeviceManagement";
import { useMediaRequest } from "./useMediaRequest";
import type { AudioDevice } from "./useDeviceManagement";

export type { AudioDevice };

export const useAudioCapture = () => {
  const { getAudioDevices, audioDevices, defaultDeviceId } = useDeviceManagement();
  const { requestMicrophoneAccess } = useMediaRequest();

  return {
    requestMicrophoneAccess,
    getAudioDevices,
    audioDevices,
    defaultDeviceId,
  };
};
