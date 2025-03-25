
import React from "react";
import { DeviceSelector } from "./DeviceSelector";
import { SystemAudioToggle } from "./SystemAudioToggle";
import { Card, CardContent } from "@/components/ui/card";
import { AudioDevice } from "@/hooks/recording/capture/types";

// Import the PermissionState type from the capture module
import { PermissionState } from "@/hooks/recording/capture/types";

interface RecordingSettingsProps {
  isSystemAudio: boolean;
  onSystemAudioChange: (value: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  isRecording: boolean;
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: PermissionState;
  disabled?: boolean;
}

export const RecordingSettings = ({
  isSystemAudio,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady,
  isRecording,
  onRefreshDevices,
  devicesLoading,
  permissionState,
  disabled = false
}: RecordingSettingsProps) => {
  return (
    <Card className="mt-6 shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Audio settings</h3>
            <div className="space-y-4">
              <DeviceSelector
                audioDevices={audioDevices}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={onDeviceSelect}
                disabled={isRecording || disabled}
                isReady={deviceSelectionReady}
                onRefreshDevices={onRefreshDevices}
                devicesLoading={devicesLoading}
                permissionState={permissionState}
              />
              
              <SystemAudioToggle 
                isSystemAudio={isSystemAudio}
                onSystemAudioChange={onSystemAudioChange}
                disabled={isRecording || disabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
