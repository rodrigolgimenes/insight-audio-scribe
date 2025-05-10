
import React from "react";
import { DeviceSelector } from "../DeviceSelector";
import { LanguageSelector } from "../LanguageSelector";
import { SystemAudioToggle } from "../SystemAudioToggle";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface RecordingSettingsProps {
  isRecording: boolean;
  isSystemAudio: boolean;
  onSystemAudioChange: (enabled: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady?: boolean;
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  disabled?: boolean;
}

export function RecordingSettings({
  isRecording,
  isSystemAudio,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady = false,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
  disabled = false
}: RecordingSettingsProps) {
  // Create a wrapper function that ensures we return a Promise
  const handleRefreshDevices = async () => {
    if (onRefreshDevices) {
      return onRefreshDevices();
    }
    return Promise.resolve();
  };

  return (
    <div className="space-y-6">
      <DeviceSelector
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        disabled={isRecording || disabled}
        isReady={deviceSelectionReady}
        onRefreshDevices={handleRefreshDevices}
        devicesLoading={devicesLoading}
        permissionState={permissionState}
      />
      
      <SystemAudioToggle
        isSystemAudio={isSystemAudio}
        onSystemAudioChange={onSystemAudioChange}
        disabled={isRecording || disabled}
      />
    </div>
  );
}
