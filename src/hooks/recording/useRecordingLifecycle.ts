
import { useCallback } from "react";
import { RecordingStateType } from "./useRecordingState";
import { AudioRecorder } from "@/utils/audio/audioRecorder";

/**
 * Hook that manages the lifecycle of a recording session
 */
export const useRecordingLifecycle = (
  recorder: React.RefObject<AudioRecorder>,
  recordingState: RecordingStateType
) => {
  const {
    mediaStream,
    setIsRecording,
    setIsPaused,
    setAudioUrl,
    setLastAction,
    setMediaStream,
    setRecordingAttemptsCount
  } = recordingState;

  // Start recording
  const startRecording = useCallback(async (deviceId: string | null, isSystemAudio: boolean) => {
    console.log('[useRecordingLifecycle] Starting recording with device ID:', deviceId);
    console.log('[useRecordingLifecycle] System audio enabled:', isSystemAudio);
    
    if (!recorder.current) {
      console.error('[useRecordingLifecycle] Recorder is not initialized');
      return false;
    }
    
    try {
      // Log that we're about to request microphone access
      console.log('[useRecordingLifecycle] Requesting microphone access');
      
      // Increment attempt counter
      setRecordingAttemptsCount(prev => prev + 1);

      // Get media stream
      let stream;
      if (isSystemAudio) {
        // Request system audio stream (via user selection)
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: false
        });
        
        // Also get microphone if available
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Create a new stream that includes both sources
          const ctx = new AudioContext();
          const dest = ctx.createMediaStreamDestination();
          
          // Connect system audio
          const systemSource = ctx.createMediaStreamSource(stream);
          systemSource.connect(dest);
          
          // Connect microphone
          const micSource = ctx.createMediaStreamSource(micStream);
          micSource.connect(dest);
          
          // Use the combined stream
          stream = dest.stream;
          
          console.log('[useRecordingLifecycle] Successfully combined system and microphone audio');
        } catch (micError) {
          console.warn('[useRecordingLifecycle] Could not get microphone, using only system audio:', micError);
          // Continue with just system audio
        }
      } else {
        // Request microphone only
        const constraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      if (!stream) {
        console.error('[useRecordingLifecycle] Failed to get media stream');
        return false;
      }
      
      console.log('[useRecordingLifecycle] Media stream obtained successfully');
      
      // Store media stream
      setMediaStream(stream);
      
      // Start recording
      await recorder.current.startRecording(stream);
      console.log('[useRecordingLifecycle] Recording started successfully');
      
      return true;
    } catch (error) {
      console.error('[useRecordingLifecycle] Error starting recording:', error);
      
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }, [recorder, setMediaStream, setRecordingAttemptsCount, setLastAction]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    console.log('[useRecordingLifecycle] Stopping recording');
    
    if (!recorder.current) {
      console.error('[useRecordingLifecycle] Recorder is not initialized');
      throw new Error('Recorder is not initialized');
    }
    
    // Check if recorder is actually recording
    if (!recorder.current.isCurrentlyRecording()) {
      console.warn('[useRecordingLifecycle] Not recording, nothing to stop');
      return { blob: null, duration: 0 };
    }
    
    try {
      // Stop recording
      const result = await recorder.current.stopRecording();
      console.log('[useRecordingLifecycle] Recording stopped, result:', result);
      
      // Update states
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop and release all tracks
      if (mediaStream) {
        console.log('[useRecordingLifecycle] Stopping media stream tracks');
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
        console.log('[useRecordingLifecycle] Audio URL created:', url);
      }
      
      return { blob, duration };
    } catch (error) {
      console.error('[useRecordingLifecycle] Error stopping recording:', error);
      
      // Make sure we clean up tracks even if there's an error
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      throw error;
    }
  }, [recorder, mediaStream, setIsRecording, setIsPaused, setAudioUrl]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    console.log('[useRecordingLifecycle] Pausing recording');
    
    if (!recorder.current) {
      console.error('[useRecordingLifecycle] Recorder is not initialized');
      return;
    }
    
    if (!recorder.current.isCurrentlyRecording()) {
      console.warn('[useRecordingLifecycle] Not recording, cannot pause');
      return;
    }
    
    if (recorder.current.isPausedState()) {
      console.warn('[useRecordingLifecycle] Already paused');
      return;
    }
    
    recorder.current.pauseRecording();
    console.log('[useRecordingLifecycle] Recording paused');
  }, [recorder]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    console.log('[useRecordingLifecycle] Resuming recording');
    
    if (!recorder.current) {
      console.error('[useRecordingLifecycle] Recorder is not initialized');
      return;
    }
    
    if (!recorder.current.isCurrentlyRecording()) {
      console.warn('[useRecordingLifecycle] Not recording, cannot resume');
      return;
    }
    
    if (!recorder.current.isPausedState()) {
      console.warn('[useRecordingLifecycle] Not paused, nothing to resume');
      return;
    }
    
    recorder.current.resumeRecording();
    console.log('[useRecordingLifecycle] Recording resumed');
  }, [recorder]);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
};
