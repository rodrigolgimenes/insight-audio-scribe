
import React from "react";
import { DeviceSelector } from "../DeviceSelector";
import { SystemAudioToggle } from "../SystemAudioToggle";
import { AudioDevice } from "@/hooks/recording/capture/types";

interface RecordingOptionsProps {
  isSystemAudio: boolean;
  onSystemAudioChange?: (isSystemAudio: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  onRefreshDevices?: () => void;
}

export const RecordingOptions = ({
  isSystemAudio,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady,
  onRefreshDevices
}: RecordingOptionsProps) => {
  return (
    <div className="mt-6 space-y-4">
      <DeviceSelector 
        audioDevices={audioDevices} 
        selectedDeviceId={selectedDeviceId} 
        onDeviceSelect={onDeviceSelect} 
        isReady={deviceSelectionReady}
        onRefreshDevices={onRefreshDevices}
      />
      
      {onSystemAudioChange && (
        <SystemAudioToggle 
          isSystemAudio={isSystemAudio} 
          onSystemAudioChange={onSystemAudioChange} 
        />
      )}
    </div>
  );
};
