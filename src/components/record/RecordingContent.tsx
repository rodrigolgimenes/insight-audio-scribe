
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";
import { AudioDevice } from "@/hooks/recording/useAudioCapture";

interface RecordingContentProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio: boolean;
  isSaving: boolean;
  isTranscribing: boolean;
  isSaveInProgress: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  handleTimeLimit: () => void;
  handleSaveRecording: () => Promise<void>;
  setIsSystemAudio: (enabled: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
}

export const RecordingContent = ({
  isRecording,
  isPaused,
  audioUrl,
  mediaStream,
  isSystemAudio,
  isSaving,
  isTranscribing,
  isSaveInProgress,
  handleStartRecording,
  handleStopRecording,
  handlePauseRecording,
  handleResumeRecording,
  handleDelete,
  handleTimeLimit,
  handleSaveRecording,
  setIsSystemAudio,
  audioDevices,
  selectedDeviceId,
  setSelectedDeviceId,
}: RecordingContentProps) => {
  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-500">Record audio from your microphone or system audio.</p>

      <RecordingSection
        isRecording={isRecording}
        isPaused={isPaused}
        audioUrl={audioUrl}
        mediaStream={mediaStream}
        isSystemAudio={isSystemAudio}
        handleStartRecording={handleStartRecording}
        handleStopRecording={handleStopRecording}
        handlePauseRecording={handlePauseRecording}
        handleResumeRecording={handleResumeRecording}
        handleDelete={handleDelete}
        handleTimeLimit={handleTimeLimit}
        onSystemAudioChange={setIsSystemAudio}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={setSelectedDeviceId}
        showPlayButton={false}
        showDeleteButton={false}
      />

      <div className="mt-6 flex justify-center">
        <SaveRecordingButton
          onSave={handleSaveRecording}
          isSaving={isSaving || isSaveInProgress}
          isDisabled={(!isRecording && !audioUrl) || isTranscribing}
        />
      </div>
    </div>
  );
};
