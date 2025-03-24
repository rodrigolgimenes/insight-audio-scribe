
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
  onRefreshDevices?: () => void | Promise<void>;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  suppressMessages?: boolean;
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
  permissionState = 'unknown',
  suppressMessages = true // Default to true
}: RecordingOptionsProps) {
  // Wrap the refresh callback to ensure it returns a Promise
  const handleRefreshDevices = onRefreshDevices ? async () => {
    const result = onRefreshDevices();
    if (result instanceof Promise) {
      return result;
    }
    return Promise.resolve();
  } : undefined;

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
        suppressMessages={suppressMessages}
      />

      <LanguageSelector
        language="en"
        setLanguage={() => {}} // This is a placeholder, language selection is not implemented
        disabled={isRecording}
      />

      <SystemAudioToggle
        isSystemAudio={isSystemAudio}
        onChange={onSystemAudioChange}
        onSystemAudioChange={onSystemAudioChange}
        disabled={isRecording}
      />
    </div>
  );
}
