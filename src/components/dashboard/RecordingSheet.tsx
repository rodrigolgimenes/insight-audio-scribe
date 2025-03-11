
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";

export function RecordingSheet() {
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    isSystemAudio,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    handleSaveRecording
  } = useRecording();

  const handleTimeLimit = () => {
    handleStopRecording().then(() => {});
  };

  return (
    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Record Audio</h2>
          <p className="text-sm text-gray-500">Record audio from your microphone or system audio.</p>
        </div>

        <RecordingSection
          isRecording={isRecording}
          isPaused={isPaused}
          audioUrl={audioUrl}
          mediaStream={mediaStream}
          isSystemAudio={isSystemAudio}
          handleStartRecording={handleStartRecording}
          handleStopRecording={() => handleStopRecording().then(() => {})}
          handlePauseRecording={handlePauseRecording}
          handleResumeRecording={handleResumeRecording}
          handleDelete={() => {}}
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
            isSaving={isSaving}
            isDisabled={!isRecording && !audioUrl}
          />
        </div>
      </div>
    </SheetContent>
  );
}
