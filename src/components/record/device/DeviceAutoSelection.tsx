
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
    if (Array.isArray(deviceList) && deviceList.length > 0) {
      console.log('[DeviceAutoSelection] Current state:', {
        deviceCount: deviceList.length,
        selectedDeviceId,
        hasAttemptedSelection
      });

      // Only attempt auto-selection if we haven't tried before and no device is selected
      if (!hasAttemptedSelection) {
        setHasAttemptedSelection(true);
        console.log('[DeviceAutoSelection] First attempt at selection');
        
        // Only auto-select if no device is already selected
        if (!selectedDeviceId) {
          const firstDevice = deviceList[0];
          if (firstDevice && typeof firstDevice === 'object') {
            const deviceId = firstDevice.deviceId || '';
            if (deviceId) {
              console.log('[DeviceAutoSelection] Auto-selecting first device:', deviceId);
              onDeviceSelect(deviceId);
            }
          }
        } else {
          console.log('[DeviceAutoSelection] Device already selected, skipping auto-selection');
        }
      } else if (!selectedDeviceId || !deviceList.some(d => d.deviceId === selectedDeviceId)) {
        // If we have a selection but it's no longer valid (device disconnected)
        const firstDevice = deviceList[0];
        if (firstDevice && typeof firstDevice === 'object') {
          const deviceId = firstDevice.deviceId || '';
          if (deviceId) {
            console.log('[DeviceAutoSelection] Re-selecting first device after list change:', deviceId);
            onDeviceSelect(deviceId);
          }
        }
      }
    }
  }, [deviceList, selectedDeviceId, onDeviceSelect, hasAttemptedSelection, setHasAttemptedSelection]);
  
  return null;
}
