
import React, { useEffect } from "react";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

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
  // Log component state on every render
  console.log('[DeviceAutoSelection RENDER]', {
    deviceCount: deviceList.length, 
    selectedDeviceId,
    hasAttemptedSelection,
    deviceList: deviceList.map(d => ({id: d.deviceId, label: 'deviceId' in d && d.label ? d.label : 'No label'}))
  });
  
  // Auto-selection logic
  useEffect(() => {
    // If we have devices but no selection has been made
    if (deviceList.length > 0 && !selectedDeviceId && !hasAttemptedSelection) {
      console.log('[DeviceAutoSelection] No device selected but devices available, auto-selecting first device');
      
      // Get the first device ID
      const firstDeviceId = deviceList[0].deviceId;
      
      if (firstDeviceId) {
        console.log('[DeviceAutoSelection] Auto-selecting device:', firstDeviceId);
        
        // Show notification for better user feedback
        toast.success("Automatically selected microphone", {
          id: "auto-device-selection"
        });
        
        // Select device and mark selection as attempted
        onDeviceSelect(firstDeviceId);
        setHasAttemptedSelection(true);
      }
    } 
    // Only check for missing device if we have already selected a device
    // This prevents clearing the selection when it's null
    else if (deviceList.length > 0 && selectedDeviceId) {
      const deviceExists = deviceList.some(device => device.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.log('[DeviceAutoSelection] Selected device not found in list, selecting first device');
        const firstDeviceId = deviceList[0].deviceId;
        
        if (firstDeviceId) {
          // Show notification
          toast.info("Selected device no longer available, switching microphone", {
            id: "device-replacement"
          });
          
          onDeviceSelect(firstDeviceId);
        }
      }
    }
  }, [deviceList, selectedDeviceId, onDeviceSelect, hasAttemptedSelection, setHasAttemptedSelection]);

  return null; // This is a logic-only component
}
