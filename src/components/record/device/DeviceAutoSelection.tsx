
import { useEffect } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface DeviceAutoSelectionProps {
  deviceList: (AudioDevice | MediaDeviceInfo)[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  hasAttemptedSelection: boolean;
  setHasAttemptedSelection: (value: boolean) => void;
}

export function DeviceAutoSelection({
  deviceList,
  selectedDeviceId,
  onDeviceSelect,
  hasAttemptedSelection,
  setHasAttemptedSelection
}: DeviceAutoSelectionProps) {
  useEffect(() => {
    if (!Array.isArray(deviceList) || deviceList.length === 0) {
      console.log('[DeviceAutoSelection] No devices available for auto-selection');
      return;
    }
    
    console.log('[DeviceAutoSelection] Current state:', {
      deviceCount: deviceList.length,
      selectedDeviceId,
      hasAttemptedSelection
    });

    // Only attempt auto-selection if:
    // 1. We haven't tried before
    // 2. No device is currently selected
    // These two conditions ensure we don't override manual selection
    if (!hasAttemptedSelection && !selectedDeviceId) {
      setHasAttemptedSelection(true);
      console.log('[DeviceAutoSelection] First attempt at selection, no device currently selected');
      
      const firstDevice = deviceList[0];
      if (firstDevice && typeof firstDevice === 'object') {
        const deviceId = firstDevice.deviceId || '';
        if (deviceId) {
          console.log('[DeviceAutoSelection] Auto-selecting first device:', deviceId);
          onDeviceSelect(deviceId);
        }
      }
    } else if (selectedDeviceId) {
      // If we have a selection, check if it's still valid
      const deviceExists = deviceList.some(d => d.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.log('[DeviceAutoSelection] Selected device no longer exists, selecting new one');
        const firstDevice = deviceList[0];
        if (firstDevice && typeof firstDevice === 'object') {
          const deviceId = firstDevice.deviceId || '';
          if (deviceId) {
            console.log('[DeviceAutoSelection] Selecting new device after list change:', deviceId);
            onDeviceSelect(deviceId);
          }
        }
      } else {
        console.log('[DeviceAutoSelection] Selected device still valid, no changes needed');
      }
    } else if (!selectedDeviceId && hasAttemptedSelection) {
      console.log('[DeviceAutoSelection] No device selected but selection was attempted before');
    }
  }, [deviceList, selectedDeviceId, onDeviceSelect, hasAttemptedSelection, setHasAttemptedSelection]);
  
  return null;
}
