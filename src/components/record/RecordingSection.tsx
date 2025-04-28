
import React from "react";
import { RecordControls } from "./RecordControls";
import { RecordingSettings } from "./RecordingSettings";
import { RecordingVisualizer } from "./RecordingVisualizer";
import { Waveform } from "@/components/ui/waveform";
import { useTimer } from "@/hooks/useTimer";
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
  onSystemAudioChange: (value: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady?: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  onSave?: () => Promise<any>;
  isSaving?: boolean;
  isLoading?: boolean;
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  disabled?: boolean;
  lastAction?: any;
  isRestrictedRoute?: boolean;
  processingProgress?: number;
  processingStage?: string;
}

export const RecordingSection = ({
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
  showPlayButton = true,
  showDeleteButton = true,
  onSave,
  isSaving = false,
  isLoading = false,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
  disabled = false,
  lastAction,
  isRestrictedRoute = false,
  processingProgress,
  processingStage
}: RecordingSectionProps) => {
  const { time, isRunning } = useTimer({
    isRecording,
    isPaused,
  });

  return (
    <div className="flex flex-col w-full items-center">
      <div className="w-full max-w-lg">
        <div className="my-8 h-32 w-full">
          {isRecording ? (
            <RecordingVisualizer
              audioStream={mediaStream}
              isRecording={isRecording}
              isPaused={isPaused}
            />
          ) : audioUrl ? (
            <Waveform src={audioUrl} />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border">
              <p className="text-gray-400 text-sm">
                Ready to record
              </p>
            </div>
          )}
        </div>
        
        <RecordControls
          isRecording={isRecording}
          isPaused={isPaused}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onPauseRecording={handlePauseRecording}
          onResumeRecording={handleResumeRecording}
          permissionState={permissionState}
          disabled={disabled}
        />
        
        <RecordingSettings
          isSystemAudio={isSystemAudio}
          onSystemAudioChange={onSystemAudioChange}
          audioDevices={audioDevices}
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={onDeviceSelect}
          deviceSelectionReady={deviceSelectionReady}
          isRecording={isRecording}
          onRefreshDevices={onRefreshDevices}
          devicesLoading={devicesLoading}
          permissionState={permissionState}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
