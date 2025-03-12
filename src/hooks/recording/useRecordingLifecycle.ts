
import { useRef, useState, useCallback, useEffect } from "react";
import { AudioRecorder } from "@/utils/audio/audioRecorder";
import { RecordingObserver } from "@/utils/audio/types";
import { logAudioTracks, validateAudioTracks } from "@/utils/audio/recordingHelpers";
import { useRecorderInit } from "./lifecycle/useRecorderInit";
import { useStartRecording } from "./lifecycle/useStartRecording";
import { useStopRecording } from "./lifecycle/useStopRecording";
import { usePauseResumeRecording } from "./lifecycle/usePauseResumeRecording";

interface RecordingLifecycleResult {
  recorder: React.RefObject<AudioRecorder>;
  isRecording: boolean;
  isPaused: boolean;
  handleStartRecording: (stream: MediaStream) => Promise<void>;
  handleStopRecording: () => Promise<{ blob: Blob | null; duration: number }>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  recordingAttemptsCount: number;
  lastAction: { 
    action: string; 
    timestamp: number; 
    success: boolean;
    error?: string;
  } | null;
}

export function useRecordingLifecycle(
  onRecordingEvent?: RecordingObserver
): RecordingLifecycleResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingAttemptsCount, setRecordingAttemptsCount] = useState(0);
  const [lastAction, setLastAction] = useState<{
    action: string;
    timestamp: number;
    success: boolean;
    error?: string;
  } | null>(null);

  const recorderRef = useRef<AudioRecorder>(new AudioRecorder());

  // Initialize recorder and handle cleanup
  const { recorder } = useRecorderInit(recorderRef, onRecordingEvent);

  // Start recording
  const { handleStartRecording: startRecording } = useStartRecording(
    recorder,
    { 
      setIsRecording, 
      setIsPaused 
    }
  );

  // Stop recording
  const { handleStopRecording: stopRecording } = useStopRecording(
    recorder,
    { 
      setIsRecording, 
      setIsPaused 
    }
  );

  // Pause/resume recording
  const { handlePauseRecording, handleResumeRecording } = usePauseResumeRecording(
    recorder,
    { 
      setIsPaused 
    }
  );

  // Enhanced start recording with diagnostic info
  const handleStartRecording = useCallback(
    async (stream: MediaStream) => {
      console.log('[useRecordingLifecycle] Starting recording with stream:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().length
      });
      
      setRecordingAttemptsCount(prev => prev + 1);
      
      try {
        // Log audio tracks before starting
        logAudioTracks(stream);
        
        // Validate the stream has audio tracks
        try {
          validateAudioTracks(stream);
        } catch (error) {
          console.error('[useRecordingLifecycle] Stream validation failed:', error);
          setLastAction({
            action: 'start',
            timestamp: Date.now(),
            success: false,
            error: `Validação de stream falhou: ${error.message}`
          });
          throw error;
        }
        
        // Attempt to start recording
        await startRecording(stream);
        
        console.log('[useRecordingLifecycle] Recording started successfully');
        setLastAction({
          action: 'start',
          timestamp: Date.now(),
          success: true
        });
      } catch (error) {
        console.error('[useRecordingLifecycle] Error starting recording:', error);
        setLastAction({
          action: 'start',
          timestamp: Date.now(),
          success: false,
          error: error.message || 'Erro desconhecido ao iniciar gravação'
        });
        throw error;
      }
    },
    [startRecording]
  );

  // Enhanced stop recording with diagnostic info
  const handleStopRecording = useCallback(async () => {
    console.log('[useRecordingLifecycle] Stopping recording');
    
    try {
      const result = await stopRecording();
      
      console.log('[useRecordingLifecycle] Recording stopped successfully', {
        blobSize: result.blob ? `${(result.blob.size / 1024 / 1024).toFixed(2)} MB` : 'No blob',
        duration: `${result.duration.toFixed(2)} seconds`
      });
      
      setLastAction({
        action: 'stop',
        timestamp: Date.now(),
        success: true
      });
      
      return result;
    } catch (error) {
      console.error('[useRecordingLifecycle] Error stopping recording:', error);
      
      setLastAction({
        action: 'stop',
        timestamp: Date.now(),
        success: false,
        error: error.message || 'Erro desconhecido ao parar gravação'
      });
      
      throw error;
    }
  }, [stopRecording]);

  // Enhanced pause recording with diagnostic info
  const handlePauseRecording = useCallback(() => {
    console.log('[useRecordingLifecycle] Pausing recording');
    
    try {
      handlePauseRecording();
      
      console.log('[useRecordingLifecycle] Recording paused successfully');
      setLastAction({
        action: 'pause',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingLifecycle] Error pausing recording:', error);
      
      setLastAction({
        action: 'pause',
        timestamp: Date.now(),
        success: false,
        error: error.message || 'Erro desconhecido ao pausar gravação'
      });
      
      throw error;
    }
  }, [handlePauseRecording]);

  // Enhanced resume recording with diagnostic info
  const handleResumeRecording = useCallback(() => {
    console.log('[useRecordingLifecycle] Resuming recording');
    
    try {
      handleResumeRecording();
      
      console.log('[useRecordingLifecycle] Recording resumed successfully');
      setLastAction({
        action: 'resume',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingLifecycle] Error resuming recording:', error);
      
      setLastAction({
        action: 'resume',
        timestamp: Date.now(),
        success: false,
        error: error.message || 'Erro desconhecido ao retomar gravação'
      });
      
      throw error;
    }
  }, [handleResumeRecording]);

  return {
    recorder,
    isRecording,
    isPaused,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    recordingAttemptsCount,
    lastAction
  };
}
