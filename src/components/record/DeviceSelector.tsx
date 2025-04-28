
import React from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { DevicePermissionError } from "./device/DevicePermissionError";
import { useDeviceContext } from "@/providers/DeviceManagerProvider";

interface DeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  isReady?: boolean;
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function DeviceSelector({
  disabled = false,
  permissionState = 'unknown'
}: DeviceSelectorProps) {
  const deviceContext = useDeviceContext();
  
  // Check if permission is denied
  if (permissionState === 'denied' || deviceContext?.permissionState === 'denied') {
    return <DevicePermissionError />;
  }
  
  // Just pass through the props that MicrophoneSelector accepts
  console.log("[DeviceSelector] Rendering unified MicrophoneSelector");
  
  // MicrophoneSelector now uses the DeviceManagerContext, so we only need to pass disabled prop
  return <MicrophoneSelector disabled={disabled} />;
}
