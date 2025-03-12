
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
  // Auto-select a device when devices become available
  useEffect(() => {
    if (Array.isArray(deviceList) && deviceList.length > 0) {
      if (!hasAttemptedSelection) {
        setHasAttemptedSelection(true);
        
        // Only auto-select if no device is already selected
        if (!selectedDeviceId) {
          const firstDevice = deviceList[0];
          if (firstDevice && typeof firstDevice === 'object') {
            const deviceId = firstDevice.deviceId || '';
            if (deviceId) {
              console.log('[DeviceSelector] Auto-selecting first device:', deviceId);
              onDeviceSelect(deviceId);
            }
          }
        }
      } else if (!selectedDeviceId || !deviceList.some(d => d.deviceId === selectedDeviceId)) {
        // If we have a selection but it's no longer valid, select first available
        const firstDevice = deviceList[0];
        if (firstDevice && typeof firstDevice === 'object') {
          const deviceId = firstDevice.deviceId || '';
          if (deviceId) {
            console.log('[DeviceSelector] Re-selecting first device after device list change:', deviceId);
            onDeviceSelect(deviceId);
          }
        }
      }
    }
  }, [deviceList, selectedDeviceId, onDeviceSelect, hasAttemptedSelection, setHasAttemptedSelection]);
  
  return null; // This is a logic-only component
}
