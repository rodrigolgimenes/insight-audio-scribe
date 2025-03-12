
import React, { useEffect } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface DeviceAutoSelectionProps {
  deviceList: AudioDevice[] | MediaDeviceInfo[];
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
  // Auto-selection logic
  useEffect(() => {
    // If we have devices but no selection has been made
    if (deviceList.length > 0 && !selectedDeviceId && !hasAttemptedSelection) {
      console.log('[DeviceAutoSelection] No device selected but devices available, auto-selecting first device');
      
      // Get the first device ID
      const firstDeviceId = deviceList[0].deviceId;
      
      if (firstDeviceId) {
        console.log('[DeviceAutoSelection] Auto-selecting device:', firstDeviceId);
        onDeviceSelect(firstDeviceId);
        setHasAttemptedSelection(true);
      }
    } 
    // If the selected device doesn't exist in the list anymore
    else if (deviceList.length > 0 && selectedDeviceId) {
      const deviceExists = deviceList.some(device => device.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.log('[DeviceAutoSelection] Selected device not found in list, selecting first device');
        const firstDeviceId = deviceList[0].deviceId;
        
        if (firstDeviceId) {
          onDeviceSelect(firstDeviceId);
        }
      }
    }
  }, [deviceList, selectedDeviceId, onDeviceSelect, hasAttemptedSelection, setHasAttemptedSelection]);

  return null; // This is a logic-only component
}
