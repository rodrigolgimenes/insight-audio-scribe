
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

  // Listen for device changes with improved error handling
  useEffect(() => {
    const handleDeviceChange = async () => {
      console.log('[useAudioCapture] Media devices changed, updating device list');
      try {
        await getAudioDevices();
        console.log('[useAudioCapture] Devices updated successfully after change');
      } catch (error) {
        console.error('[useAudioCapture] Error updating devices on change:', error);
      }
    };

    // Only set listener if we have permission
    if (permissionGranted) {
      console.log('[useAudioCapture] Setting up device change listener');
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      
      return () => {
        console.log('[useAudioCapture] Removing device change listener');
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    } else {
      console.log('[useAudioCapture] Permission not granted, skipping device listener setup');
    }
    
    return undefined;
  }, [permissionGranted, getAudioDevices]);

  return {
    requestMicrophoneAccess,
    getAudioDevices,
    audioDevices,
    defaultDeviceId,
    permissionGranted,
    checkPermissions,
    hasPermission: permissionGranted // Added alias for better readability
  };
};
