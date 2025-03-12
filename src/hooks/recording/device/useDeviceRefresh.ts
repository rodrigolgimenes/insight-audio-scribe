
import { useCallback } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";

/**
 * Hook for handling device refresh operations
 */
export const useDeviceRefresh = (
  checkPermissions: () => Promise<boolean>,
  getAudioDevices: () => Promise<{devices: AudioDevice[], defaultId: string | null}>,
  setPermissionGranted: (value: boolean) => void,
  setDeviceSelectionReady: (value: boolean) => void,
  setSelectedDeviceId: (deviceId: string) => void,
  selectedDeviceId: string | null,
  refreshTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  permissionCheckedRef: React.MutableRefObject<boolean>
) => {
  // Check permissions and refresh devices
  const refreshDevices = useCallback(async () => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    console.log('[useDeviceRefresh] Refreshing devices manually');
    
    try {
      // First check permissions
      const hasPermission = await checkPermissions();
      setPermissionGranted(hasPermission);
      permissionCheckedRef.current = true;
      
      if (!hasPermission) {
        console.warn('[useDeviceRefresh] No microphone permission during refresh');
        setDeviceSelectionReady(false);
        return { devices: [] as AudioDevice[], defaultId: null };
      }
      
      const result = await getAudioDevices();
      const devices = result.devices; 
      const defaultId = result.defaultId;
      
      console.log('[useDeviceRefresh] Device refresh resulted in:', devices.length, 'devices');
      
      // If we have devices but no selection, select one
      if (devices.length > 0) {
        if (!selectedDeviceId || !devices.some(d => d.deviceId === selectedDeviceId)) {
          // Select the first available device
          const deviceToSelect = devices[0].deviceId;
          
          if (deviceToSelect) {
            setSelectedDeviceId(deviceToSelect);
          }
        } else {
          // We already have a valid selection, ensure ready state is true
          setDeviceSelectionReady(true);
        }
      } else {
        setDeviceSelectionReady(false);
      }
      
      return { devices, defaultId };
    } catch (error) {
      console.error('[useDeviceRefresh] Error refreshing devices:', error);
      setDeviceSelectionReady(false);
      return { devices: [] as AudioDevice[], defaultId: null };
    }
  }, [
    checkPermissions, 
    getAudioDevices, 
    selectedDeviceId, 
    setSelectedDeviceId, 
    setDeviceSelectionReady, 
    setPermissionGranted,
    refreshTimeoutRef,
    permissionCheckedRef
  ]);

  return {
    refreshDevices
  };
};
