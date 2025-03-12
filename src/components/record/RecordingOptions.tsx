
import { useState, useEffect } from "react";
import { DeviceSelector } from "./DeviceSelector";
import { LanguageSelector } from "./LanguageSelector";
import { SystemAudioToggle } from "./SystemAudioToggle";
import { AudioDevice } from "@/hooks/recording/useAudioCapture";

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

  // Auto-select first device if none is selected and devices are available
  useEffect(() => {
    if (hasDevices && !selectedDeviceId && audioDevices.length > 0) {
      console.log('[RecordingOptions] Auto-selecting first device:', audioDevices[0].deviceId);
      onDeviceSelect(audioDevices[0].deviceId);
    }
  }, [hasDevices, selectedDeviceId, audioDevices, onDeviceSelect]);

  return (
    <div className="space-y-6 mb-8">
      <DeviceSelector
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        disabled={isRecording}
        hasDevices={hasDevices}
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
