
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
import { RecordingLogger } from "@/utils/audio/recordingLogger";
import { useRecordingState } from "./recording/useRecordingState";
import { useAudioCapture } from "./recording/useAudioCapture";
import { useAudioProcessing } from "./recording/useAudioProcessing";
import { useToast } from "./use-toast";

export const useRecording = () => {
  const {
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    audioUrl,
    setAudioUrl,
    mediaStream,
    setMediaStream,
    isSaving,
    setIsSaving,
    isTranscribing,
    setIsTranscribing,
    isSystemAudio,
    setIsSystemAudio,
  } = useRecordingState();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { requestMicrophoneAccess, getAudioDevices, audioDevices } = useAudioCapture();
  const { saveRecording } = useAudioProcessing();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const audioRecorder = useRef(new AudioRecorder());
  const isProcessing = useRef(false);
  const logger = useRef(new RecordingLogger());

  useEffect(() => {
    getAudioDevices();
    audioRecorder.current.addObserver(logger.current);
    
    return () => {
      audioRecorder.current.removeObserver(logger.current);
      resetRecording();
    };
  }, []);

  const resetRecording = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setIsRecording(false);
    setIsPaused(false);
    setAudioUrl(null);
    setMediaStream(null);
    setIsSaving(false);
    setIsTranscribing(false);
    audioRecorder.current = new AudioRecorder();
  };

  const handleStartRecording = async () => {
    console.log('[useRecording] Starting recording process');
    
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
      const stream = await requestMicrophoneAccess(selectedDeviceId, isSystemAudio);
      if (!stream) return;

      setMediaStream(stream);
      await audioRecorder.current.startRecording(stream);
      setIsRecording(true);
      setIsPaused(false);
      
      console.log('[useRecording] Recording started with stream:', stream.id);

      stream.addEventListener('inactive', () => {
        console.log('[useRecording] Stream became inactive');
        if (!isProcessing.current) {
          handleStopRecording();
        }
      });
    } catch (error) {
      console.error('[useRecording] Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please check your microphone settings and try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      const { blob, duration } = await audioRecorder.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop and clear the media stream
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }

      // Create object URL for preview
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      console.log('[useRecording] Recording stopped successfully');
    } catch (error) {
      console.error('[useRecording] Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      isProcessing.current = false;
    }
  };

  const handlePauseRecording = () => {
    try {
      audioRecorder.current.pauseRecording();
      setIsPaused(true);
    } catch (error) {
      console.error('[useRecording] Error pausing recording:', error);
    }
  };

  const handleResumeRecording = () => {
    try {
      audioRecorder.current.resumeRecording();
      setIsPaused(false);
    } catch (error) {
      console.error('[useRecording] Error resuming recording:', error);
    }
  };

  const handleDelete = () => {
    resetRecording();
  };

  return {
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
  };
};
