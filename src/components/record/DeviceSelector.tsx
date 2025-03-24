
import React from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface DeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  isReady?: boolean;
  onRefreshDevices?: () => void;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function DeviceSelector({
  disabled = false
}: Partial<DeviceSelectorProps>) {
  // Just pass through to our centralized MicrophoneSelector component
  console.log("[DeviceSelector] Rendering unified MicrophoneSelector");
  return <MicrophoneSelector disabled={disabled} />;
}
