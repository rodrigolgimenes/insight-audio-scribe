import React from "react";
import { DeviceSelector } from "@/components/record/DeviceSelector";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => Promise<any>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  onSystemAudioChange: (value: boolean) => void;
  audioDevices: any[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  lastAction: any;
  onRefreshDevices?: () => Promise<any>;
  devicesLoading: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  isRestrictedRoute?: boolean;
  onSave?: () => Promise<any>;
  isLoading?: boolean;
  isSaving?: boolean;
  showNoDevicesWarning?: boolean;
}

export function RecordingSection({
  isRecording,
  isPaused,
  audioUrl,
  mediaStream,
  isSystemAudio,
  handleStartRecording,
  handleStopRecording,
  handlePauseRecording,
  handleResumeRecording,
  handleDelete,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady,
  lastAction,
  onRefreshDevices,
  devicesLoading,
  permissionState,
  showPlayButton = true,
  showDeleteButton = true,
  isRestrictedRoute = false,
  onSave,
  isLoading,
  isSaving,
  showNoDevicesWarning = true
}: RecordingSectionProps) {
  return (
    <div>
      
      <DeviceSelector 
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        disabled={isRecording || devicesLoading}
        isReady={deviceSelectionReady}
        onRefreshDevices={onRefreshDevices}
        devicesLoading={devicesLoading}
        permissionState={permissionState}
        showNoDevicesWarning={showNoDevicesWarning}
      />
      
    </div>
  );
}
