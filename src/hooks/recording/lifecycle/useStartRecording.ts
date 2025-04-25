
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";
import { MIC_CONSTRAINTS } from "../audioConfig";

export function useStartRecording(
  recorder: React.RefObject<any>,
  recordingState: RecordingStateType
) {
  const {
    setMediaStream,
    setIsRecording,
    setIsPaused,
    setLastAction,
    setRecordingAttemptsCount,
    recordingMode
  } = recordingState;

  const startRecording = useCallback(async (deviceId: string | null, isSystemAudio: boolean) => {
    console.log(`[useStartRecording] Starting ${recordingMode} recording`);
    
    if (!recorder.current) {
      console.error('[useStartRecording] Recorder is not initialized');
      return false;
    }
    
    try {
      // Increment attempt counter
      setRecordingAttemptsCount(prev => prev + 1);

      let stream;
      
      if (recordingMode === 'screen') {
        // Request screen capture with optional audio
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: isSystemAudio 
        });
        
        // If system audio is requested, try to add microphone audio as well
        if (isSystemAudio) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create a combined stream with both screen and mic audio
            const tracks = [
              ...stream.getVideoTracks(),
              ...stream.getAudioTracks(),
              ...micStream.getAudioTracks()
            ];
            
            stream = new MediaStream(tracks);
          } catch (error) {
            console.warn('[useStartRecording] Could not get microphone, using only system audio:', error);
            // Continue with just screen and system audio
          }
        }
      } else {
        // Regular audio recording
        if (isSystemAudio) {
          // Request system audio stream (via user selection)
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: false
          });
          
          // Also get microphone if available
          try {
            const micConstraints = {
              audio: deviceId 
                ? { deviceId: { exact: deviceId } }
                : true
            };
            
            const micStream = await navigator.mediaDevices.getUserMedia(micConstraints);
            
            // Create a new stream that includes both sources
            const tracks = [
              ...stream.getAudioTracks(),
              ...micStream.getAudioTracks()
            ];
            
            stream = new MediaStream(tracks);
            
            console.log('[useStartRecording] Successfully combined system and microphone audio');
          } catch (micError) {
            console.warn('[useStartRecording] Could not get microphone, using only system audio:', micError);
            // Continue with just system audio
          }
        } else {
          // Request microphone only
          const constraints = {
            audio: deviceId 
              ? { deviceId: { exact: deviceId } } 
              : true
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      }
      
      if (!stream) {
        console.error('[useStartRecording] Failed to get media stream');
        return false;
      }
      
      console.log('[useStartRecording] Media stream obtained successfully');
      
      // Log tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      console.log('[useStartRecording] Video tracks:', videoTracks.length);
      console.log('[useStartRecording] Audio tracks:', audioTracks.length);
      
      // Store media stream
      setMediaStream(stream);
      
      // Start recording
      await recorder.current.startRecording(stream);
      console.log('[useStartRecording] Recording started successfully');
      
      return true;
    } catch (error) {
      console.error('[useStartRecording] Error starting recording:', error);
      
      setLastAction({
        action: `Start ${recordingMode} recording`,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }, [recorder, setMediaStream, setRecordingAttemptsCount, setLastAction, recordingMode]);

  return {
    startRecording
  };
}
