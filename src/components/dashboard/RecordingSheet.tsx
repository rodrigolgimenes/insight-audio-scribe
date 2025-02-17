
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { useRecording } from "@/hooks/useRecording";
import { Button } from "@/components/ui/button";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";

export const RecordingSheet = () => {
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
    handleDelete,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    handleSaveRecording,
  } = useRecording();

  // Create a function to handle the time limit (25 minutes)
  const handleTimeLimit = () => {
    handleStopRecording();
  };

  return (
    <SheetContent side="right" className="w-[600px] sm:w-[540px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Record Audio</SheetTitle>
      </SheetHeader>
      
      <div className="mt-6">
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
        />

        {audioUrl && (
          <div className="mt-6 flex justify-center">
            <SaveRecordingButton 
              onSave={handleSaveRecording}
              isSaving={isSaving}
              isDisabled={isTranscribing}
            />
          </div>
        )}
      </div>
    </SheetContent>
  );
};
