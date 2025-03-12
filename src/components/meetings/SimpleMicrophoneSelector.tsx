
import React from "react";
import { MicrophoneSelector } from "@/components/microphone/MicrophoneSelector";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface SimpleMicrophoneSelectorProps {
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function SimpleMicrophoneSelector({
  disabled = false
}: Partial<SimpleMicrophoneSelectorProps>) {
  // Just pass through to our centralized MicrophoneSelector component
  return <MicrophoneSelector disabled={disabled} />;
}
