
import { MicrophoneSelector as UnifiedMicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useEffect } from "react";
import { useDeviceManager } from "@/context/DeviceManagerContext";

// Este é um wrapper de compatibilidade para manter imports existentes
export function MicrophoneSelector(props: { disabled?: boolean; className?: string }) {
  const { selectedDeviceId, permissionState } = useDeviceManager();
  
  // Log para debug
  useEffect(() => {
    console.log("[MicrophoneSelector Wrapper] Current state:", {
      selectedDeviceId,
      permissionState
    });
  }, [selectedDeviceId, permissionState]);
  
  return <UnifiedMicrophoneSelector {...props} />;
}
