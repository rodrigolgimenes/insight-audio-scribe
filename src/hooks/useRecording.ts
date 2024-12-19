import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { AudioRecorder } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";

export const useRecording = () => {
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
    if (!session?.user) {
      toast({
        title: "Error",
        description: "Please log in to record audio.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

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
      navigate("/login");
      return;
    }

    setIsSaving(true);
    try {
      const { blob, duration } = await audioRecorder.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setMediaStream(null);

      const fileName = `${session.user.id}/${Date.now()}.webm`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('Upload successful but file path is missing');
      }

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
        await supabase.storage
          .from('audio_recordings')
          .remove([fileName]);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      setIsTranscribing(true);
      const { error: transcriptionError } = await supabase.functions
        .invoke('transcribe-audio', {
          body: { recordingId: recordingData.id },
        });

      if (transcriptionError) {
        throw new Error(`Transcription failed: ${transcriptionError.message}`);
      }

      toast({
        title: "Success",
        description: "Recording saved and transcribed successfully!",
      });
      
      navigate("/app");
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsTranscribing(false);
    }
  };

  const handlePauseRecording = () => {
    audioRecorder.current.pauseRecording();
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    audioRecorder.current.resumeRecording();
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

  return {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
  };
};