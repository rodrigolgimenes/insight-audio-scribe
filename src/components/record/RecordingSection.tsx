
import { RecordingControls } from "./RecordingControls";
import { RecordingSettings } from "./RecordingSettings";
import { RecordingVisualizer } from "./RecordingVisualizer";
import { RecordingTimer } from "./RecordingTimer";
import { RecordingActions } from "./RecordingActions";
import { Waveform } from "@/components/ui/waveform";
import { useTimer } from "@/hooks/useTimer";

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
  audioDevices: Array<{ deviceId: string; label: string }>;
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
  processingStage = ""
}: RecordingSectionProps) => {
  const { time, isRunning } = useTimer({
    isRecording,
    isPaused,
  });

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
          />
        )}
      </div>
    </div>
  );
};
