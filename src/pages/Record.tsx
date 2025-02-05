import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { RecordingSection } from "@/components/record/RecordingSection";
import { AudioRecorder } from "@/utils/audioRecorder";

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSystemAudio, setIsSystemAudio] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const audioRecorder = new AudioRecorder();

  const handleStartRecording = async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "Please login to record audio.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      await audioRecorder.startRecording(isSystemAudio);
      setIsRecording(true);
      setIsPaused(false);
      
      if (!isSystemAudio) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: isSystemAudio 
          ? "Could not capture system audio. Please check permissions."
          : "Could not start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      const { blob, duration } = await audioRecorder.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setMediaStream(null);

      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);

      // Save to Supabase
      const fileName = `${session?.user.id}/${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, blob);

      if (uploadError) {
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      const { error: dbError } = await supabase.from('recordings')
        .insert({
          user_id: session?.user.id,
          title: `Recording ${new Date().toLocaleString()}`,
          duration,
          file_path: fileName,
        });

      if (dbError) {
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      toast({
        title: "Success",
        description: "Recording saved successfully!",
      });
      
      navigate("/app");
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recording",
        variant: "destructive",
      });
    }
  };

  const handlePauseRecording = () => {
    audioRecorder.pauseRecording();
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    audioRecorder.resumeRecording();
    setIsPaused(false);
  };

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
    if (isRecording) {
      handleStopRecording();
      toast({
        title: "Time Limit Reached",
        description: "Recording stopped due to 25-minute time limit.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Record Audio</h1>
        
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
          setIsSystemAudio={setIsSystemAudio}
        />
      </div>
    </div>
  );
};

export default Record;