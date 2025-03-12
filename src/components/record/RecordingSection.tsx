
import React from "react";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { RecordingHeader } from "./sections/RecordingHeader";
import { RecordingMain } from "./sections/RecordingMain";
import { RecordingOptions } from "./sections/RecordingOptions";
import { RecordingActions } from "./sections/RecordingActions";
import { useDiagnostics } from "@/hooks/recording/useDiagnostics";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio?: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete?: () => void;
  onSystemAudioChange?: (isSystemAudio: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  showDiagnosticsPanel?: boolean;
  lastAction?: { 
    action: string; 
    timestamp: number; 
    success: boolean;
    error?: string;
  };
  onRefreshDevices?: () => void;
  devicesLoading?: boolean;
  permissionState?: 'prompt'|'granted'|'denied'|'unknown';
}

export function RecordingSection({
  isRecording,
  isPaused,
  audioUrl,
  mediaStream,
  isSystemAudio = false,
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
  showDeleteButton = false,
  showDiagnosticsPanel = true,
  lastAction,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
}: RecordingSectionProps) {
  // Use our diagnostics hook
  useDiagnostics({
    selectedDeviceId,
    deviceSelectionReady,
    audioDevices,
    isRecording
  });

  return (
    <div className="space-y-4">
      {/* Header Section with Timer */}
      <RecordingHeader 
        isRecording={isRecording} 
        isPaused={isPaused} 
      />
      
      {/* Main Recording Controls */}
      <RecordingMain 
        isRecording={isRecording}
        isPaused={isPaused}
        mediaStream={mediaStream}
        handleStartRecording={handleStartRecording}
        handleStopRecording={handleStopRecording}
        handlePauseRecording={handlePauseRecording}
        handleResumeRecording={handleResumeRecording}
        deviceSelectionReady={deviceSelectionReady}
        selectedDeviceId={selectedDeviceId}
        audioDevices={audioDevices}
        lastAction={lastAction}
      />
      
      {/* Device and System Audio Options */}
      <RecordingOptions 
        isSystemAudio={isSystemAudio}
        onSystemAudioChange={onSystemAudioChange}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        deviceSelectionReady={deviceSelectionReady}
        onRefreshDevices={onRefreshDevices}
        devicesLoading={devicesLoading}
        permissionState={permissionState}
      />
      
      {/* Delete Recording Button */}
      <RecordingActions 
        showDeleteButton={showDeleteButton}
        handleDelete={handleDelete}
        audioUrl={audioUrl}
      />
      
      {/* Diagnostics Panel */}
      {showDiagnosticsPanel && (
        <DiagnosticsPanel
          isRecording={isRecording}
          isPaused={isPaused}
          mediaStream={mediaStream}
          deviceSelectionReady={deviceSelectionReady}
          deviceId={selectedDeviceId}
          lastAction={lastAction}
          onRefreshDevices={onRefreshDevices}
          deviceCount={audioDevices.length}
          devicesLoading={devicesLoading}
          permissionState={permissionState}
        />
      )}
    </div>
  );
}
