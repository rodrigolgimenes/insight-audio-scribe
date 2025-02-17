
import { useNavigate } from "react-router-dom";
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function RecordingSheet() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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
    handleSaveRecording
  } = useRecording();

  const handleTimeLimit = () => {
    handleStopRecording();
  };

  const confirmDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    handleDelete();
    setShowDeleteDialog(false);
    toast({
      title: "Recording Canceled",
      description: "The recording has been discarded",
    });
    navigate("/app");
  };

  return (
    <>
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
            handleDelete={confirmDelete}
            handleTimeLimit={handleTimeLimit}
            onSystemAudioChange={setIsSystemAudio}
            audioDevices={audioDevices}
            selectedDeviceId={selectedDeviceId}
            onDeviceSelect={setSelectedDeviceId}
            showPlayButton={false}
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Recording</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this recording? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Recording</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Yes, Cancel Recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
