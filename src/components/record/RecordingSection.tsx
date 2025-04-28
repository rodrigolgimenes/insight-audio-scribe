
import React from "react";
import { RecordControls } from "./RecordControls";
import { RecordingSettings } from "./RecordingSettings";
import { RecordingVisualizer } from "./RecordingVisualizer";
import { Waveform } from "@/components/ui/waveform";
import { useTimer } from "@/hooks/useTimer";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

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
  onSave?: () => Promise<any>;
  handleDelete: () => void;
  onSystemAudioChange: (value: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady?: boolean;
  showDeleteButton?: boolean;
  showPlayButton?: boolean;
  isSaving?: boolean;
  isLoading?: boolean;
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: 'prompt' | 'granted' | 'denied' | 'unknown';
  disabled?: boolean;
  lastAction?: any;
  processingProgress?: number;
  processingStage?: string;
  isRestrictedRoute?: boolean;
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
  onSave,
  handleDelete,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady,
  showDeleteButton = true,
  showPlayButton = true,
  isSaving = false,
  isLoading = false,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
  disabled = false,
  lastAction,
  processingProgress,
  processingStage,
  isRestrictedRoute = false
}: RecordingSectionProps) => {
  const { time, isRunning } = useTimer({
    isRecording,
    isPaused,
  });

  const handleTranscribe = async () => {
    console.log('[RecordingSection] Starting transcribe process');
    console.log('[RecordingSection] Current state:', {
      isRecording,
      isPaused,
      audioUrl: audioUrl ? 'exists' : null,
      mediaStream: mediaStream ? 'active' : null
    });

    try {
      if (isRecording) {
        console.log('[RecordingSection] Stopping active recording first');
        const stopResult = await handleStopRecording();
        console.log('[RecordingSection] Stop recording result:', stopResult);
        
        // Add a small delay to ensure everything is processed
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!audioUrl && !mediaStream) {
        throw new Error('No recording data available');
      }

      console.log('[RecordingSection] Initiating save process');
      if (onSave) {
        await onSave();
      }
    } catch (error) {
      console.error('[RecordingSection] Error in transcribe process:', error);
      toast.error("Failed to process recording", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

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
          handleStartRecording={handleStartRecording}
          handleTranscribe={handleTranscribe}
          handlePauseRecording={handlePauseRecording}
          handleResumeRecording={handleResumeRecording}
          permissionState={permissionState}
          disabled={disabled || isSaving}
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

        {(isSaving || isLoading) && processingProgress !== undefined && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {processingStage || "Processing..."}
            </p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
