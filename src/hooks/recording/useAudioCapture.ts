
import { useEffect } from "react";
import { useSystemAudio } from "./useSystemAudio";
import { usePermissions } from "./capture/usePermissions";
import { useDeviceEnumeration } from "./capture/useDeviceEnumeration";
import { useMicrophoneAccess } from "./capture/useMicrophoneAccess";
import { AudioDevice } from "./capture/types";

export type { AudioDevice } from "./capture/types";

export const useAudioCapture = () => {
  const { captureSystemAudio } = useSystemAudio();
  const { permissionGranted, setPermissionGranted, checkPermissions } = usePermissions();
  const { audioDevices, defaultDeviceId, getAudioDevices } = useDeviceEnumeration(checkPermissions);
  const { requestMicrophoneAccess } = useMicrophoneAccess(checkPermissions, captureSystemAudio);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log('[useAudioCapture] Media devices changed, updating device list');
      getAudioDevices().catch(error => {
        console.error('[useAudioCapture] Error updating devices on change:', error);
      });
    };

    // Only set listener if we have permission
    if (permissionGranted) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
    
    return undefined;
  }, [permissionGranted, getAudioDevices]);

  return {
    requestMicrophoneAccess,
    getAudioDevices,
    audioDevices,
    defaultDeviceId,
    permissionGranted,
    checkPermissions
  };
};
