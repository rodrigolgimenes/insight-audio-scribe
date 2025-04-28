
import React from "react";
import { DeviceSelector } from "../DeviceSelector";
import { LanguageSelector } from "../LanguageSelector";
import { SystemAudioToggle } from "../SystemAudioToggle";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface RecordingOptionsProps {
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
}

export function RecordingOptions({
  isRecording,
  isSystemAudio,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady = false,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown'
}: RecordingOptionsProps) {
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
        disabled={isRecording}
        isReady={deviceSelectionReady}
        onRefreshDevices={handleRefreshDevices}
        devicesLoading={devicesLoading}
        permissionState={permissionState}
      />

      <LanguageSelector
        language="en"
        setLanguage={() => {}} // This is a placeholder, language selection is not implemented
        disabled={isRecording}
      />

      <SystemAudioToggle
        isSystemAudio={isSystemAudio}
        onSystemAudioChange={onSystemAudioChange}
        onChange={onSystemAudioChange} // Add this line to fix the type error
        disabled={isRecording}
      />
    </div>
  );
}
