
import { RecordingControls } from "./RecordingControls";
import { RecordingSettings } from "./RecordingSettings";
import { RecordingVisualizer } from "./RecordingVisualizer";
import { RecordingTimer } from "./RecordingTimer";
import { RecordingActions } from "./RecordingActions";
import { Waveform } from "@/components/ui/waveform";
import { useTimer } from "@/hooks/useTimer";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  onSystemAudioChange: (value: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
  lastAction?: { action: string; timestamp: number; success: boolean };
  onRefreshDevices?: () => Promise<void>;
  devicesLoading?: boolean;
  permissionState?: PermissionState;
  processingProgress?: number;
  processingStage?: string;
  isRestrictedRoute?: boolean;
  audioFileSize?: number | null;
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
  lastAction,
  onRefreshDevices,
  devicesLoading = false,
  permissionState,
  processingProgress = 0,
  processingStage = "",
  isRestrictedRoute = false,
  audioFileSize = null
}: RecordingSectionProps) => {
  const { time, isRunning } = useTimer({
    isRecording,
    isPaused,
  });

  // Format file size to human readable format
  const formatFileSize = (bytes: number | null): string => {
    if (bytes === null) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if file size is too large (exceeds 100MB)
  const isFileTooLarge = audioFileSize && audioFileSize > 100 * 1024 * 1024;

  return (
    <div className="flex flex-col w-full items-center">
      <div className="w-full max-w-lg">
        {/* Timer display */}
        <RecordingTimer time={time} isRecording={isRecording} isPaused={isPaused} />

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
                Audio visualization will appear here
              </p>
            </div>
          )}
        </div>
        
        {/* File size display */}
        {audioUrl && audioFileSize !== null && (
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">File size:</span>
              <Badge variant={isFileTooLarge ? "destructive" : "secondary"} className="font-mono">
                {formatFileSize(audioFileSize)}
              </Badge>
            </div>
            {isFileTooLarge && (
              <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                Exceeds 100MB limit
              </Badge>
            )}
          </div>
        )}
        
        {/* File size warning */}
        {isFileTooLarge && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This recording exceeds the 100MB upload limit. Try a shorter recording or lower quality settings.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Recording controls */}
        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          audioUrl={audioUrl}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
          onDelete={handleDelete}
          showPlayButton={showPlayButton}
          showDeleteButton={showDeleteButton}
          isLoading={isLoading}
        />
        
        {/* Device settings */}
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
        />
        
        {/* Recording actions (save/upload) */}
        {onSave && (
          <RecordingActions
            onSave={onSave}
            isSaving={isSaving}
            isLoading={isLoading}
            isRecording={isRecording}
            hasRecording={Boolean(audioUrl)}
            processingProgress={processingProgress}
            processingStage={processingStage}
            isDisabled={isFileTooLarge}
          />
        )}
      </div>
    </div>
  );
};
