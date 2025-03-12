
import { useEffect } from "react";
import { MicrophoneSelector as UnifiedMicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useDeviceManager } from "@/context/DeviceManagerContext";

// This is a compatibility wrapper to maintain existing imports
export function MicrophoneSelector(props: { disabled?: boolean; className?: string }) {
  const { selectedDeviceId, permissionState, devices } = useDeviceManager();
  
  // Detailed logging for debugging
  useEffect(() => {
    console.log("[MicrophoneSelector Wrapper] Current state:", {
      selectedDeviceId,
      permissionState,
      deviceCount: devices.length,
      deviceList: devices.map(d => ({ id: d.deviceId, label: d.label }))
    });
  }, [selectedDeviceId, permissionState, devices]);
  
  return <UnifiedMicrophoneSelector {...props} />;
}
