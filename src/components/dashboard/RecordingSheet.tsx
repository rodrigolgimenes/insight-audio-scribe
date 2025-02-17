
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface RecordingSheetProps {
  onOpenChange?: (open: boolean) => void;
}

export function RecordingSheet({ onOpenChange }: RecordingSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
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
  } = useRecording();

  const handleTimeLimit = () => {
    handleStopRecording();
  };

  const handleSaveRecording = async () => {
    try {
      await handleStopRecording();
      
      // Close the modal
      if (onOpenChange) {
        onOpenChange(false);
      }

      // If we're not on the dashboard, navigate to it
      if (location.pathname !== '/app') {
        navigate('/app');
      }

      // Invalidate notes query to force a refresh of the dashboard data
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
      
    } catch (error) {
      console.error('Error saving recording:', error);
    }
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
          handleStopRecording={handleStopRecording}
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
