
import React from "react";
import { MicrophoneSelector } from "@/components/microphone/MicrophoneSelector";
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
  disabled = false
}: Partial<TestDeviceSelectorProps>) {
  // Just pass through to our centralized MicrophoneSelector component
  return <MicrophoneSelector disabled={disabled} />;
}
