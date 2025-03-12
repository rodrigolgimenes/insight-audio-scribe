
import { useEffect } from "react";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { RecordTimer } from "@/components/record/RecordTimer";
import { RecordControls } from "@/components/record/RecordControls";
import { RecordStatus } from "@/components/record/RecordStatus";
import { RecordingOptions } from "@/components/record/RecordingOptions";
import { AudioDevice } from "@/hooks/recording/useAudioCapture";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void | Promise<void>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  onSystemAudioChange: (enabled: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady?: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
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
  deviceSelectionReady = false,
  showPlayButton = true,
  showDeleteButton = true,
}: RecordingSectionProps) => {
  const canStartRecording = !!selectedDeviceId && deviceSelectionReady;
  const hasDevices = audioDevices.length > 0;

  useEffect(() => {
    if (hasDevices && !selectedDeviceId && deviceSelectionReady && audioDevices.length > 0) {
      console.log('[RecordingSection] Auto-selecting first device');
      onDeviceSelect(audioDevices[0].deviceId);
    }
  }, [hasDevices, selectedDeviceId, deviceSelectionReady, audioDevices, onDeviceSelect]);

  return (
    <>
      <RecordStatus isRecording={isRecording} isPaused={isPaused} />

      <div className="mb-8">
        {audioUrl ? (
          <audio controls src={audioUrl} className="w-full" />
        ) : (
          <AudioVisualizer isRecording={isRecording && !isPaused} stream={mediaStream ?? undefined} />
        )}
      </div>

      <RecordingOptions
        isRecording={isRecording}
        isSystemAudio={isSystemAudio}
        onSystemAudioChange={onSystemAudioChange}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
      />

      <div className="mb-12">
        <RecordTimer 
          isRecording={isRecording} 
          isPaused={isPaused}
        />
      </div>

      <div className="mb-12">
        <RecordControls
          isRecording={isRecording}
          isPaused={isPaused}
          hasRecording={!!audioUrl}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onPauseRecording={handlePauseRecording}
          onResumeRecording={handleResumeRecording}
          onDelete={handleDelete}
          onPlay={() => {
            const audio = document.querySelector('audio');
            if (audio) audio.play();
          }}
          disabled={!canStartRecording}
          showPlayButton={showPlayButton}
          showDeleteButton={showDeleteButton}
        />
      </div>
    </>
  );
};
