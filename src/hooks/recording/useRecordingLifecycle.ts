
import { useCallback, useState } from "react";
import { useSimpleRecorder } from "./useSimpleRecorder";

/**
 * Hook to manage recording lifecycle including start, stop, pause and resume
 */
export const useRecordingLifecycle = () => {
  const {
    recorder,
    getCurrentDuration,
    initializeRecorder,
  } = useSimpleRecorder();
  
  const [recordingAttemptsCount, setRecordingAttemptsCount] = useState(0);
  const [lastAction, setLastAction] = useState<{
    action: string;
    timestamp: number;
    success: boolean;
    error?: string;
  } | null>(null);
  
  // Handle recording start
  const handleStartRecording = useCallback(async (stream: MediaStream) => {
    try {
      console.log('[useRecordingLifecycle] Starting recording with stream');
      setRecordingAttemptsCount(prev => prev + 1);
      
      setLastAction({
        action: 'Starting recorder',
        timestamp: Date.now(),
        success: false
      });
      
      if (!recorder.current) {
        throw new Error('Recorder not initialized');
      }
      
      await recorder.current.startRecording(stream);
      
      setLastAction({
        action: 'Starting recorder',
        timestamp: Date.now(),
        success: true
      });
      return true;
    } catch (error) {
      console.error('[useRecordingLifecycle] Error starting recording:', error);
      setLastAction({
        action: 'Starting recorder',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }, [recorder]);
  
  // Handle recording stop
  const handleStopRecording = useCallback(async () => {
    try {
      console.log('[useRecordingLifecycle] Stopping recording');
      
      setLastAction({
        action: 'Stopping recorder',
        timestamp: Date.now(),
        success: false
      });
      
      if (!recorder.current) {
        throw new Error('Recorder not initialized');
      }
      
      const result = await recorder.current.stopRecording();
      
      setLastAction({
        action: 'Stopping recorder',
        timestamp: Date.now(),
        success: true
      });
      return result;
    } catch (error) {
      console.error('[useRecordingLifecycle] Error stopping recording:', error);
      setLastAction({
        action: 'Stopping recorder',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { blob: null, duration: 0 };
    }
  }, [recorder]);
  
  // Check if the recorder is paused using a public method
  const isPaused = useCallback(() => {
    return recorder.current ? recorder.current.isPausedState() : false;
  }, [recorder]);
  
  // Handle recording pause
  const handlePauseRecording = useCallback(() => {
    try {
      console.log('[useRecordingLifecycle] Pausing recording');
      
      if (!recorder.current) {
        throw new Error('Recorder not initialized');
      }
      
      recorder.current.pauseRecording();
      
      setLastAction({
        action: 'Pausing recorder',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingLifecycle] Error pausing recording:', error);
      setLastAction({
        action: 'Pausing recorder',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [recorder]);
  
  // Handle recording resume
  const handleResumeRecording = useCallback(() => {
    try {
      console.log('[useRecordingLifecycle] Resuming recording');
      
      if (!recorder.current) {
        throw new Error('Recorder not initialized');
      }
      
      recorder.current.resumeRecording();
      
      setLastAction({
        action: 'Resuming recorder',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingLifecycle] Error resuming recording:', error);
      setLastAction({
        action: 'Resuming recorder',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [recorder]);
  
  return {
    recorder,
    isRecording: !!recorder.current?.isCurrentlyRecording(),
    isPaused: isPaused(),
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    initializeRecorder,
    getCurrentDuration,
    recordingAttemptsCount,
    lastAction
  };
};
