import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AudioRecorder } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { RecordTimer } from "@/components/record/RecordTimer";
import { RecordControls } from "@/components/record/RecordControls";
import { RecordHeader } from "@/components/record/RecordHeader";
import { RecordStatus } from "@/components/record/RecordStatus";
import { RecordActions } from "@/components/record/RecordActions";
import { TranscriptionLoading } from "@/components/record/TranscriptionLoading";

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const audioRecorder = useRef(new AudioRecorder());

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      await audioRecorder.current.startRecording();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not start recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save recordings.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { blob, duration } = await audioRecorder.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setMediaStream(null);

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const fileName = `${session.user.id}/${Date.now()}.webm`;
      
      // Upload to storage bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, blob);

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('Upload successful but file path is missing');
      }

      // Save to database
      const { error: dbError, data: recordingData } = await supabase.from('recordings')
        .insert({
          user_id: session.user.id,
          title: `Recording ${new Date().toLocaleString()}`,
          duration,
          file_path: fileName,
        })
        .select()
        .single();

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from('audio_recordings')
          .remove([fileName]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Start transcription
      setIsTranscribing(true);
      const { error: transcriptionError, data: transcriptionData } = await supabase.functions
        .invoke('transcribe-audio', {
          body: { recordingId: recordingData.id },
        });

      if (transcriptionError) {
        throw new Error(`Transcription error: ${transcriptionError.message}`);
      }

      if (!transcriptionData?.success) {
        throw new Error('Transcription failed without error message');
      }

      toast({
        title: "Success",
        description: "Recording saved and transcribed successfully!",
      });
      
      // Navigate to the notes page after successful save
      navigate("/app/notes");
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recording. Please try again.",
        variant: "destructive",
      });

      // Reset states on error
      setIsSaving(false);
      setIsTranscribing(false);
      return;
    }

    setIsSaving(false);
    setIsTranscribing(false);
  };

  const handlePauseRecording = () => {
    audioRecorder.current.pauseRecording();
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    audioRecorder.current.resumeRecording();
    setIsPaused(false);
  };

  const handleBack = () => navigate("/app");

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setMediaStream(null);
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleTimeLimit = () => {
    handleStopRecording();
    toast({
      title: "Time Limit Reached",
      description: "Recording stopped after reaching the 25-minute limit.",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-white">
          <RecordHeader onBack={handleBack} />

          <main className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <RecordStatus isRecording={isRecording} isPaused={isPaused} />

              <div className="mb-8">
                {audioUrl ? (
                  <audio controls src={audioUrl} className="w-full max-w-md" />
                ) : (
                  <AudioVisualizer isRecording={isRecording && !isPaused} stream={mediaStream ?? undefined} />
                )}
              </div>

              <div className="mb-12">
                <RecordTimer 
                  isRecording={isRecording} 
                  isPaused={isPaused}
                  onTimeLimit={handleTimeLimit}
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
                />
              </div>

              <RecordActions
                onSave={handleStopRecording}
                isSaving={isSaving}
                isRecording={isRecording}
              />
            </div>
          </main>
        </div>
      </div>
      {isTranscribing && <TranscriptionLoading />}
    </SidebarProvider>
  );
};

export default Record;