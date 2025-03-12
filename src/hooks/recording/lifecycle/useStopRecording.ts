
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";

export function useStopRecording(
  recorder: React.RefObject<any>,
  recordingState: RecordingStateType
) {
  const {
    mediaStream,
    setIsRecording,
    setIsPaused,
    setAudioUrl
  } = recordingState;

  const stopRecording = useCallback(async () => {
    console.log('[useStopRecording] Stopping recording');
    
    if (!recorder.current) {
      console.error('[useStopRecording] Recorder is not initialized');
      throw new Error('Recorder is not initialized');
    }
    
    // Check if recorder is actually recording
    if (!recorder.current.isCurrentlyRecording()) {
      console.warn('[useStopRecording] Not recording, nothing to stop');
      return { blob: null, duration: 0 };
    }
    
    try {
      // Stop recording
      const result = await recorder.current.stopRecording();
      console.log('[useStopRecording] Recording stopped, result:', result);
      
      // Update states
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop and release all tracks
      if (mediaStream) {
        console.log('[useStopRecording] Stopping media stream tracks');
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Get blob from result
      const blob = result?.blob || null;
      const duration = result?.duration || result?.stats?.duration || 0;
      
      if (blob) {
        // Create object URL
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        console.log('[useStopRecording] Audio URL created:', url);
      }
      
      return { blob, duration };
    } catch (error) {
      console.error('[useStopRecording] Error stopping recording:', error);
      
      // Make sure we clean up tracks even if there's an error
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      throw error;
    }
  }, [recorder, mediaStream, setIsRecording, setIsPaused, setAudioUrl]);

  return {
    stopRecording
  };
}
