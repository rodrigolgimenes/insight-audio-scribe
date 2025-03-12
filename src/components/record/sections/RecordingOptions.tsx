
import React, { useEffect } from "react";
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
  devicesLoading?: boolean;
  permissionState?: 'prompt'|'granted'|'denied'|'unknown';
}

export const RecordingOptions = ({
  isSystemAudio,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown'
}: RecordingOptionsProps) => {
  // Log device information on every render for debugging
  useEffect(() => {
    console.log('[RecordingOptions] Received props:', {
      audioDevicesCount: audioDevices.length,
      audioDevices: audioDevices.map(d => ({ id: d.deviceId, label: d.label })),
      selectedDeviceId,
      deviceSelectionReady,
      permissionState,
      devicesLoading
    });
  }, [audioDevices, selectedDeviceId, deviceSelectionReady, permissionState, devicesLoading]);

  return (
    <div className="mt-6 space-y-4">
      <DeviceSelector 
        audioDevices={audioDevices} 
        selectedDeviceId={selectedDeviceId} 
        onDeviceSelect={onDeviceSelect} 
        isReady={deviceSelectionReady}
        onRefreshDevices={onRefreshDevices}
        devicesLoading={devicesLoading}
        permissionState={permissionState}
      />
      
      {onSystemAudioChange && (
        <SystemAudioToggle 
          isSystemAudio={isSystemAudio} 
          onSystemAudioChange={onSystemAudioChange} 
        />
      )}
    </div>
  );
}
