
import { useState } from "react";
import { MicrophoneSelector } from "@/components/microphone/MicrophoneSelector";
import { LanguageSelector } from "./LanguageSelector";
import { SystemAudioToggle } from "./SystemAudioToggle";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface RecordingOptionsProps {
  isRecording: boolean;
  isSystemAudio: boolean;
  onSystemAudioChange: (enabled: boolean) => void;
  audioDevices?: AudioDevice[];
  selectedDeviceId?: string | null;
  onDeviceSelect?: (deviceId: string) => void;
  deviceSelectionReady?: boolean;
  onRefreshDevices?: () => void;
  devicesLoading?: boolean;
  permissionState?: 'prompt'|'granted'|'denied'|'unknown';
}

export function RecordingOptions({
  isRecording,
  isSystemAudio,
  onSystemAudioChange
}: RecordingOptionsProps) {
  const [language, setLanguage] = useState("en");

  return (
    <div className="space-y-6 mb-8">
      {/* Use the centralized MicrophoneSelector component */}
      <MicrophoneSelector disabled={isRecording} />

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
