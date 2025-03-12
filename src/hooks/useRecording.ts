
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
  const { requestMicrophoneAccess, getAudioDevices, audioDevices, defaultDeviceId } = useAudioCapture();
  const { saveRecording } = useAudioProcessing();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const audioRecorder = useRef(new AudioRecorder());
  const isProcessing = useRef(false);
  const logger = useRef(new RecordingLogger());

  useEffect(() => {
    const initDevices = async () => {
      await getAudioDevices();
    };
    
    initDevices();
    audioRecorder.current.addObserver(logger.current);
    
    return () => {
      audioRecorder.current.removeObserver(logger.current);
    };
  }, []);

  // This effect sets the selected device to the first device in the list when available
  useEffect(() => {
    if (defaultDeviceId && !selectedDeviceId) {
      console.log('[useRecording] Setting first device as default:', defaultDeviceId);
      setSelectedDeviceId(defaultDeviceId);
    }
  }, [defaultDeviceId, selectedDeviceId]);

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
      setMediaStream(null);

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      console.log('[useRecording] Recording stopped successfully with duration (seconds):', duration);

      return { blob, duration };
    } catch (error) {
      console.error('[useRecording] Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording. Please try again.",
        variant: "destructive",
      });
      return { blob: null, duration: 0 };
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
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setMediaStream(null);
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleSaveRecording = async () => {
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
      console.log('[useRecording] Saving recording with duration (seconds):', duration);
      const success = await saveRecording(session.user.id, blob, duration);
      
      if (success) {
        navigate("/app");
      }
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
    handleSaveRecording,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    getCurrentDuration: () => audioRecorder.current.getCurrentDuration()
  };
};
