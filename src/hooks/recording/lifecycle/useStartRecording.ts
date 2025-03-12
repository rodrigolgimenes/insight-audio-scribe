
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";

export function useStartRecording(
  recorder: React.RefObject<any>,
  recordingState: RecordingStateType
) {
  const {
    setMediaStream,
    setIsRecording,
    setIsPaused,
    setLastAction,
    setRecordingAttemptsCount
  } = recordingState;

  const startRecording = useCallback(async (deviceId: string | null, isSystemAudio: boolean) => {
    console.log('[useStartRecording] Starting recording with device ID:', deviceId);
    console.log('[useStartRecording] System audio enabled:', isSystemAudio);
    
    if (!recorder.current) {
      console.error('[useStartRecording] Recorder is not initialized');
      return false;
    }
    
    try {
      // Log that we're about to request microphone access
      console.log('[useStartRecording] Requesting microphone access');
      
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
          
          console.log('[useStartRecording] Successfully combined system and microphone audio');
        } catch (micError) {
          console.warn('[useStartRecording] Could not get microphone, using only system audio:', micError);
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
        console.error('[useStartRecording] Failed to get media stream');
        return false;
      }
      
      console.log('[useStartRecording] Media stream obtained successfully');
      
      // Store media stream
      setMediaStream(stream);
      
      // Start recording
      await recorder.current.startRecording(stream);
      console.log('[useStartRecording] Recording started successfully');
      
      return true;
    } catch (error) {
      console.error('[useStartRecording] Error starting recording:', error);
      
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }, [recorder, setMediaStream, setRecordingAttemptsCount, setLastAction]);

  return {
    startRecording
  };
}
