
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface RecordingSheetProps {
  onOpenChange?: (open: boolean) => void;
}

export function RecordingSheet({ onOpenChange }: RecordingSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  
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
    if (isSaveInProgress) return;

    try {
      setIsSaveInProgress(true);

      // If still recording, stop it first
      if (isRecording) {
        await handleStopRecording();
      }

      // Wait a moment to ensure the audio is properly stopped
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Make sure we have either audioUrl or mediaStream
      if (!audioUrl && !mediaStream) {
        throw new Error('No audio data available');
      }

      // Save the recording
      console.log('Starting save process...');
      await handleStopRecording();
      
      // Wait for the saving process to complete
      console.log('Waiting for save to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the queryClient to force a refresh
      console.log('Invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['notes'] });

      // Wait for the query invalidation
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Save completed successfully');
      toast({
        title: "Success",
        description: "Recording saved successfully!",
      });

      // Only close the modal after everything is done
      if (onOpenChange) {
        onOpenChange(false);
      }

      // If we're not on the dashboard, navigate to it
      if (location.pathname !== '/app') {
        navigate('/app');
      }
      
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaveInProgress(false);
    }
  };

  return (
    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
      <SheetTitle className="text-lg font-semibold mb-2">Record Audio</SheetTitle>
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
            isSaving={isSaving || isSaveInProgress}
            isDisabled={(!isRecording && !audioUrl) || isTranscribing}
          />
        </div>
      </div>
    </SheetContent>
  );
}
