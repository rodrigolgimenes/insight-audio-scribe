
import { useRef, useCallback } from "react";
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

  const initializeRecorder = useCallback(() => {
    console.log('[useRecordingLifecycle] Initializing recorder');
    audioRecorder.current.addObserver(logger.current);
    return () => {
      audioRecorder.current.removeObserver(logger.current);
    };
  }, []);

  const handleStartRecording = useCallback(async (selectedDeviceId: string | null) => {
    console.log('[useRecordingLifecycle] Starting recording process with device:', selectedDeviceId);
    
    if (!selectedDeviceId) {
      console.error('[useRecordingLifecycle] No device selected for recording');
      toast({
        title: "Erro",
        description: "Por favor, selecione um microfone primeiro.",
        variant: "destructive",
      });
      return;
    }
    
    if (!session?.user) {
      toast({
        title: "Erro",
        description: "Por favor, faça login para gravar áudio.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      console.log('[useRecordingLifecycle] Requesting microphone access');
      const stream = await requestMicrophoneAccess(selectedDeviceId, isSystemAudio);
      if (!stream) {
        console.error('[useRecordingLifecycle] Failed to get media stream');
        return;
      }

      console.log('[useRecordingLifecycle] Got media stream:', stream.id);
      setMediaStream(stream);
      
      console.log('[useRecordingLifecycle] Starting audio recorder');
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
        title: "Erro",
        description: "Não foi possível iniciar a gravação. Verifique as configurações do seu microfone e tente novamente.",
        variant: "destructive",
      });
    }
  }, [isSystemAudio, navigate, requestMicrophoneAccess, session, setIsRecording, setIsPaused, setMediaStream, toast]);

  const handleStopRecording = useCallback(async () => {
    if (isProcessing.current) return { blob: null, duration: 0 };
    isProcessing.current = true;

    try {
      console.log('[useRecordingLifecycle] Stopping recording');
      const { blob, duration } = await audioRecorder.current.stopRecording();
      
      setIsRecording(false);
      setIsPaused(false);
      
      if (mediaStream) {
        console.log('[useRecordingLifecycle] Stopping media tracks');
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
        setMediaStream(null);
      }

      if (blob) {
        console.log('[useRecordingLifecycle] Creating audio URL from blob');
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        console.log('[useRecordingLifecycle] Recording stopped successfully with duration (seconds):', duration);
      } else {
        console.error('[useRecordingLifecycle] No blob returned from recorder');
      }

      return { blob, duration };
    } catch (error) {
      console.error('[useRecordingLifecycle] Error stopping recording:', error);
      toast({
        title: "Erro",
        description: "Falha ao parar a gravação. Por favor, tente novamente.",
        variant: "destructive",
      });
      return { blob: null, duration: 0 };
    } finally {
      isProcessing.current = false;
    }
  }, [mediaStream, setAudioUrl, setIsRecording, setIsPaused, setMediaStream, toast]);

  const handlePauseRecording = useCallback(() => {
    console.log('[useRecordingLifecycle] Pausing recording');
    try {
      audioRecorder.current.pauseRecording();
      setIsPaused(true);
    } catch (error) {
      console.error('[useRecordingLifecycle] Error pausing recording:', error);
    }
  }, [setIsPaused]);

  const handleResumeRecording = useCallback(() => {
    console.log('[useRecordingLifecycle] Resuming recording');
    try {
      audioRecorder.current.resumeRecording();
      setIsPaused(false);
    } catch (error) {
      console.error('[useRecordingLifecycle] Error resuming recording:', error);
    }
  }, [setIsPaused]);

  const handleDelete = useCallback(() => {
    console.log('[useRecordingLifecycle] Deleting recording');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      setMediaStream(null);
    }
    
    setIsRecording(false);
    setIsPaused(false);
  }, [audioUrl, mediaStream, setAudioUrl, setIsRecording, setIsPaused, setMediaStream]);

  const handleSaveRecording = useCallback(async () => {
    if (!session?.user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar gravações.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSaving(true);
    try {
      let blob, duration;
      
      if (isRecording) {
        console.log('[useRecordingLifecycle] Stopping recording before saving');
        const result = await handleStopRecording();
        blob = result.blob;
        duration = result.duration;
      } else if (audioRecorder.current.isCurrentlyRecording()) {
        console.log('[useRecordingLifecycle] Recorder is still active, stopping');
        const result = await audioRecorder.current.stopRecording();
        blob = result.blob;
        duration = result.duration;
      } else {
        console.log('[useRecordingLifecycle] Getting current recording state for saving');
        blob = audioRecorder.current.getFinalBlob?.() || null;
        duration = audioRecorder.current.getCurrentDuration();
      }
      
      if (!blob) {
        console.error('[useRecordingLifecycle] No blob available for saving');
        throw new Error('Não foi possível obter o áudio para salvar');
      }
      
      console.log('[useRecordingLifecycle] Saving recording with duration (seconds):', duration);
      const success = await saveRecording(session.user.id, blob, duration);
      
      if (success) {
        navigate("/app");
      }
    } catch (error) {
      console.error('[useRecordingLifecycle] Error saving recording:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar a gravação. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [handleStopRecording, isRecording, navigate, saveRecording, session, setIsSaving, toast]);

  const getCurrentDuration = useCallback(() => {
    return audioRecorder.current.getCurrentDuration();
  }, []);

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
