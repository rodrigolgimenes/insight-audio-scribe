
import { useEffect } from "react";
import { MicrophoneSelector as UnifiedMicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useDeviceManager } from "@/context/DeviceManagerContext";

// Este é um wrapper de compatibilidade para manter imports existentes
export function MicrophoneSelector(props: { disabled?: boolean; className?: string }) {
  const { selectedDeviceId, permissionState, devices } = useDeviceManager();
  
  // Log mais detalhado para depuração
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
