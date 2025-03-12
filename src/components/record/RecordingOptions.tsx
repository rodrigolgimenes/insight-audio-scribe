
import { useState } from "react";
import { DeviceSelector } from "./DeviceSelector";
import { LanguageSelector } from "./LanguageSelector";
import { SystemAudioToggle } from "./SystemAudioToggle";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface RecordingOptionsProps {
  isRecording: boolean;
  isSystemAudio: boolean;
  onSystemAudioChange: (enabled: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
}

export function RecordingOptions({
  isRecording,
  isSystemAudio,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect
}: RecordingOptionsProps) {
  const [language, setLanguage] = useState("en");
  const hasDevices = audioDevices.length > 0;

  return (
    <div className="space-y-6 mb-8">
      <DeviceSelector
        devices={[]} // Pass empty array for compatibility
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        disabled={isRecording}
        hasDevices={hasDevices}
        isReady={true}
      />

      <LanguageSelector
        language={language}
        setLanguage={setLanguage}
        disabled={isRecording}
      />

      <SystemAudioToggle
        isSystemAudio={isSystemAudio}
        onSystemAudioChange={onSystemAudioChange}
        disabled={isRecording}
      />
    </div>
  );
}
