
import { useState, useEffect } from "react";
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
  onRefreshDevices?: () => void;
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
  const [language, setLanguage] = useState("en");
  const hasDevices = audioDevices.length > 0;

  // Add logging to track device and permission states
  useEffect(() => {
    console.log('[RecordingOptions] State updated:', {
      compName: 'RecordingOptions',
      audioDevicesCount: audioDevices.length,
      selectedDeviceId,
      deviceSelectionReady,
      permissionState,
      hasDevices,
      devicesLoading,
      timestamp: new Date().toISOString(),
      deviceDetails: audioDevices.map(d => ({ id: d.deviceId, label: d.label || 'No label' }))
    });
    
    // If permission is granted but we have no devices, try refreshing
    if (permissionState === 'granted' && !hasDevices && onRefreshDevices && !devicesLoading) {
      console.log('[RecordingOptions] Permission granted but no devices, triggering refresh');
      onRefreshDevices();
    }
  }, [audioDevices, selectedDeviceId, deviceSelectionReady, permissionState, hasDevices, devicesLoading, onRefreshDevices]);

  // Log on every render for consistency
  console.log('[RecordingOptions RENDER]', {
    compName: 'RecordingOptions',
    audioDevicesCount: audioDevices.length,
    permissionState,
    deviceSelectionReady,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="space-y-6 mb-8">
      <DeviceSelector
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={(deviceId) => {
          console.log('[RecordingOptions] Device selected:', deviceId);
          onDeviceSelect(deviceId);
        }}
        disabled={isRecording}
        isReady={deviceSelectionReady}
        onRefreshDevices={() => {
          console.log('[RecordingOptions] Refresh devices triggered');
          if (onRefreshDevices) onRefreshDevices();
        }}
        devicesLoading={devicesLoading}
        permissionState={permissionState}
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
