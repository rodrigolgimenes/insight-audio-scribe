
import { useRecording } from "@/hooks/useRecording";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RecordingSection } from "@/components/record/RecordingSection";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface RecordingSheetProps {
  onOpenChange?: (open: boolean) => void;
}

export function RecordingSheet({ onOpenChange }: RecordingSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSaveInProgress, setIsSaveInProgress] = useState(false);
  const { session } = useAuth();
  
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
    resetRecording,
  } = useRecording();

  // Reset recording state when modal opens
  useEffect(() => {
    if (resetRecording) {
      resetRecording();
    }
  }, [resetRecording]);

  const handleTimeLimit = () => {
    if (isRecording) {
      handleStopRecording();
      toast({
        title: "Time Limit Reached",
        description: "Recording was stopped after reaching the time limit.",
      });
    }
  };

  const handleSaveRecording = async () => {
    if (isSaveInProgress) return;

    try {
      setIsSaveInProgress(true);

      // If still recording, stop it first
      if (isRecording) {
        await handleStopRecording();
      }

      // Make sure we have either audioUrl or mediaStream
      if (!audioUrl && !mediaStream) {
        throw new Error('No audio data available');
      }

      const timestamp = Date.now();
      const fileName = `${session?.user?.id}/${timestamp}.webm`;
      const recordingTitle = `Recording ${new Date().toLocaleString()}`;

      console.log('Creating recording entry...');
      const { data: recordingData, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          title: recordingTitle,
          file_path: fileName,
          user_id: session?.user?.id,
          status: 'pending'
        })
        .select()
        .single();

      if (recordingError) {
        console.error('Error creating recording:', recordingError);
        throw new Error('Failed to create recording entry');
      }

      console.log('Recording entry created:', recordingData);

      console.log('Creating note entry...');
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          title: recordingTitle,
          recording_id: recordingData.id,
          user_id: session?.user?.id,
          status: 'pending',
          processing_progress: 0,
          processed_content: ''
        })
        .select()
        .single();

      if (noteError) {
        console.error('Error creating note:', noteError);
        // Cleanup the recording entry if note creation fails
        await supabase
          .from('recordings')
          .delete()
          .eq('id', recordingData.id);
        throw new Error('Failed to create note entry');
      }

      console.log('Note entry created:', noteData);

      // Update the queryClient to force a refresh
      console.log('Invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['notes'] });

      // Start processing in background
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { 
            recordingId: recordingData.id,
            noteId: noteData.id
          }
        });

      if (processError) {
        console.error('Error starting processing:', processError);
        toast({
          title: "Warning",
          description: "Recording saved but processing may be delayed. It will retry automatically.",
          variant: "destructive",
        });
      }

      // Add a small delay before closing the modal
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Save completed successfully');
      toast({
        title: "Success",
        description: "Recording saved successfully! Processing will begin shortly.",
      });

      // Reset recording state
      resetRecording();

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
        description: error instanceof Error ? error.message : "Failed to save recording. Please try again.",
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
    </SheetContent>
  );
}
