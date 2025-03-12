
import React from "react";
import { DeviceSelector } from "@/components/record/DeviceSelector";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface TestDeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function TestDeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  disabled = false,
  isLoading = false,
  label = "Select Microphone",
  permissionState = 'unknown'
}: TestDeviceSelectorProps) {
  return (
    <DeviceSelector
      audioDevices={audioDevices}
      selectedDeviceId={selectedDeviceId}
      onDeviceSelect={onDeviceSelect}
      disabled={disabled}
      isReady={!isLoading}
      devicesLoading={isLoading}
      permissionState={permissionState}
    />
  );
}
