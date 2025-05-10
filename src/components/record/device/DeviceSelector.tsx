
import React from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { DevicePermissionError } from "./DevicePermissionError";

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
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  disabled = false,
  isReady = false,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown'
}: DeviceSelectorProps) {
  // Check if permission is denied
  if (permissionState === 'denied') {
    return <DevicePermissionError />;
  }

  // Define a wrapper function that ensures we return a Promise
  const handleRefreshDevices = async () => {
    if (onRefreshDevices) {
      return onRefreshDevices();
    }
    return Promise.resolve();
  };

  // Just pass through to our centralized MicrophoneSelector component
  console.log("[DeviceSelector] Rendering unified MicrophoneSelector");
  return <MicrophoneSelector 
    disabled={disabled} 
    audioDevices={audioDevices}
    selectedDeviceId={selectedDeviceId}
    onDeviceSelect={onDeviceSelect}
    isReady={isReady}
    onRefreshDevices={handleRefreshDevices}
    devicesLoading={devicesLoading}
  />;
}
