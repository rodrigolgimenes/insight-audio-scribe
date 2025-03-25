
import React from "react";
import { RecordingButtons } from "./RecordingButtons";
import { RecordingOptions } from "./sections/RecordingOptions";
import { AudioPlayer } from "./AudioPlayer";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { NoDevicesWarning } from "./NoDevicesWarning";
import { AudioDevice } from "@/hooks/recording/capture/types";

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
  onSystemAudioChange: (enabled: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady?: boolean;
  lastAction?: string;
  showPlayButton?: boolean;
  onSave?: () => Promise<{ success: boolean }>;
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  suppressMessages?: boolean;
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
  deviceSelectionReady = false,
  lastAction,
  showPlayButton = true,
  onSave,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
  suppressMessages = true // Always default to true to suppress messages
}: RecordingSectionProps) {
  // We never want to show the NoDevicesWarning, so we skip the check completely
  // and directly render the main content

  return (
    <div className="space-y-6">
      {/* Do not render NoDevicesWarning ever */}
      
      <RecordingOptions
        isRecording={isRecording}
        isSystemAudio={isSystemAudio}
        onSystemAudioChange={onSystemAudioChange}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        deviceSelectionReady={deviceSelectionReady}
        onRefreshDevices={onRefreshDevices}
        devicesLoading={devicesLoading}
        permissionState={permissionState}
        suppressMessages={true} // Always suppress messages
      />

      <RecordingButtons
        isRecording={isRecording}
        isPaused={isPaused}
        handleStartRecording={handleStartRecording}
        handleStopRecording={handleStopRecording}
        handlePauseRecording={handlePauseRecording}
        handleResumeRecording={handleResumeRecording}
        selectedDeviceId={selectedDeviceId}
        deviceSelectionReady={deviceSelectionReady}
        onSave={onSave}
      />

      {audioUrl && (
        <div className="space-y-4">
          <AudioPlayer audioUrl={audioUrl} showPlayButton={showPlayButton} />
          <Button
            variant="outline"
            onClick={handleDelete}
            className="w-full text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Recording
          </Button>
        </div>
      )}
    </div>
  );
}
