
import { useRef, useEffect } from "react";
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

  const { requestMicrophoneAccess } = useAudioCapture();
  const { saveRecording } = useAudioProcessing();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const audioRecorder = useRef(new AudioRecorder());
  const isProcessing = useRef(false);
  const logger = useRef(new RecordingLogger());

  useEffect(() => {
    // Add the logger observer when the component mounts
    audioRecorder.current.addObserver(logger.current);
    
    // Remove the observer when the component unmounts
    return () => {
      audioRecorder.current.removeObserver(logger.current);
    };
  }, []);

  const handleStartRecording = async () => {
    console.log('[useRecording] Starting recording process');
    
    if (!session?.user) {
      toast({
        title: "Erro",
        description: "Por favor, faça login para gravar áudio.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const stream = await requestMicrophoneAccess(isSystemAudio);
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
  };

  const handleStopRecording = async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

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

      setIsTranscribing(true);
      const success = await saveRecording(session.user.id, blob, duration);
      
      if (success) {
        navigate("/app");
      }
    } finally {
      setIsSaving(false);
      setIsTranscribing(false);
      isProcessing.current = false;
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
    isSystemAudio,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    setIsSystemAudio,
  };
};

