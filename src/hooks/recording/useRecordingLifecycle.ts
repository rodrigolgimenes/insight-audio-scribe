
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
import { RecordingLogger } from "@/utils/audio/recordingLogger";
import { useToast } from "@/hooks/use-toast";
import { useRecordingState } from "./useRecordingState";
import { useAudioCapture } from "./useAudioCapture";
import { useAudioProcessing } from "./useAudioProcessing";

export const useRecordingLifecycle = () => {
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
    isSystemAudio,
  } = useRecordingState();

  const { requestMicrophoneAccess } = useAudioCapture();
  const { saveRecording } = useAudioProcessing();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const audioRecorder = useRef(new AudioRecorder());
  const isProcessing = useRef(false);
  const logger = useRef(new RecordingLogger());

  const initializeRecorder = () => {
    console.log('[useRecordingLifecycle] Initializing recorder');
    audioRecorder.current.addObserver(logger.current);
    return () => {
      audioRecorder.current.removeObserver(logger.current);
    };
  };

  const handleStartRecording = async (selectedDeviceId: string | null) => {
    console.log('[useRecordingLifecycle] Starting recording process with device:', selectedDeviceId);
    
    if (!selectedDeviceId) {
      console.error('[useRecordingLifecycle] No device selected for recording');
      toast({
        title: "Error",
        description: "Please select a microphone first.",
        variant: "destructive",
      });
      return;
    }
    
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
      if (!stream) {
        console.error('[useRecordingLifecycle] Failed to get media stream');
        return;
      }

      setMediaStream(stream);
      await audioRecorder.current.startRecording(stream);
      setIsRecording(true);
      setIsPaused(false);
      
      console.log('[useRecordingLifecycle] Recording started with stream:', stream.id);

      stream.addEventListener('inactive', () => {
        console.log('[useRecordingLifecycle] Stream became inactive');
        if (!isProcessing.current) {
          handleStopRecording();
        }
      });
    } catch (error) {
      console.error('[useRecordingLifecycle] Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please check your microphone settings and try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    if (isProcessing.current) return { blob: null, duration: 0 };
    isProcessing.current = true;

    try {
      const { blob, duration } = await audioRecorder.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setMediaStream(null);

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      console.log('[useRecordingLifecycle] Recording stopped successfully with duration (seconds):', duration);

      return { blob, duration };
    } catch (error) {
      console.error('[useRecordingLifecycle] Error stopping recording:', error);
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
      console.error('[useRecordingLifecycle] Error pausing recording:', error);
    }
  };

  const handleResumeRecording = () => {
    try {
      audioRecorder.current.resumeRecording();
      setIsPaused(false);
    } catch (error) {
      console.error('[useRecordingLifecycle] Error resuming recording:', error);
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
      console.log('[useRecordingLifecycle] Saving recording with duration (seconds):', duration);
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

  const getCurrentDuration = () => audioRecorder.current.getCurrentDuration();

  return {
    initializeRecorder,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    getCurrentDuration
  };
};
