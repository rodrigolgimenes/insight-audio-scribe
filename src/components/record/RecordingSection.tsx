
import React from "react";
import { RecordingControls } from "./RecordingControls";
import { RecordingSettings } from "./RecordingSettings";
import { RecordingVisualizer } from "./RecordingVisualizer";
import { Waveform } from "@/components/ui/waveform";
import { useTimer } from "@/hooks/useTimer";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { PermissionState as CapturePermissionState } from "@/hooks/recording/capture/permissions/types";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio: boolean;
  recordingMode?: 'audio' | 'screen';
  handleStartRecording: () => void;
  handleStopRecording: () => Promise<any>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  onSystemAudioChange: (value: boolean) => void;
  onToggleRecordingMode?: () => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  onSave?: () => Promise<any>;
  isSaving?: boolean;
  isLoading?: boolean;
  lastAction?: { action: string; timestamp: number; success: boolean };
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: CapturePermissionState;
  processingProgress?: number;
  processingStage?: string;
  isRestrictedRoute?: boolean;
  showRecordingActions?: boolean;
  disabled?: boolean;
}

export const RecordingSection = ({
  isRecording,
  isPaused,
  audioUrl,
  mediaStream,
  isSystemAudio,
  recordingMode = 'audio',
  handleStartRecording,
  handleStopRecording,
  handlePauseRecording,
  handleResumeRecording,
  handleDelete,
  onSystemAudioChange,
  onToggleRecordingMode,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady,
  showPlayButton = true,
  showDeleteButton = true,
  onSave,
  isSaving = false,
  isLoading = false,
  lastAction,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
  processingProgress = 0,
  processingStage = "",
  isRestrictedRoute = false,
  showRecordingActions = false,
  disabled = false
}: RecordingSectionProps) => {
  const { time, isRunning } = useTimer({
    isRecording,
    isPaused,
  });

  return (
    <div className="flex flex-col w-full items-center">
      <div className="w-full max-w-lg">
        {/* Audio visualizer */}
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
                {recordingMode === 'audio' ? 'Ready to record audio' : 'Ready to record screen'}
              </p>
            </div>
          )}
        </div>
        
        {/* Recording controls */}
        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          audioUrl={audioUrl}
          recordingMode={recordingMode}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
          onDelete={handleDelete}
          onToggleMode={onToggleRecordingMode}
          showPlayButton={showPlayButton}
          showDeleteButton={showDeleteButton}
          isLoading={isLoading}
          onSave={onSave}
          isSaving={isSaving}
          processingProgress={processingProgress}
          processingStage={processingStage}
          disabled={disabled}
        />
        
        {/* Only show device settings for audio recording mode */}
        {recordingMode === 'audio' && (
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
        )}

        {/* For screen recording, just show system audio toggle */}
        {recordingMode === 'screen' && !isRecording && !audioUrl && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include-audio"
                checked={isSystemAudio}
                onChange={(e) => onSystemAudioChange(e.target.checked)}
                className="mr-2"
                disabled={disabled || isRecording}
              />
              <label htmlFor="include-audio" className="text-sm">Include microphone audio</label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
