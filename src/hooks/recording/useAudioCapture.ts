
import { useDeviceManagement, AudioDevice } from "./useDeviceManagement";
import { useMediaRequest } from "./useMediaRequest";

export { AudioDevice };

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
