
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";

export function useSaveDeleteRecording(
  recordingState: RecordingStateType,
  stopRecording: () => Promise<{ blob: Blob | null; duration: number }>,
  setLastAction: (action: { action: string; timestamp: number; success: boolean; error?: string } | null) => void
) {
  const { setAudioUrl, setMediaStream, mediaStream, isRecording } = recordingState;
  
  const handleDelete = useCallback(() => {
    console.log('[useSaveDeleteRecording] Deleting recording');
    
    setLastAction({
      action: 'Delete recording',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      // Release the audio URL
      setAudioUrl(null);
      
      // Stop and release all tracks
      if (mediaStream) {
        console.log('[useSaveDeleteRecording] Stopping media stream tracks');
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
        setMediaStream(null);
      }
      
      setLastAction({
        action: 'Delete recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useSaveDeleteRecording] Recording deleted successfully');
    } catch (error) {
      console.error('[useSaveDeleteRecording] Error deleting recording:', error);
      setLastAction({
        action: 'Delete recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [mediaStream, setAudioUrl, setMediaStream, setLastAction]);

  const handleSaveRecording = useCallback(async () => {
    console.log('[useSaveDeleteRecording] Saving recording');
    
    setLastAction({
      action: 'Save recording',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      let blob = null;
      let duration = 0;
      
      // If we're still recording, stop it first
      if (isRecording) {
        console.log('[useSaveDeleteRecording] Still recording, stopping first');
        const result = await stopRecording();
        blob = result.blob;
        duration = result.duration;
      }
      
      setLastAction({
        action: 'Save recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useSaveDeleteRecording] Recording saved successfully');
      return { blob, duration };
    } catch (error) {
      console.error('[useSaveDeleteRecording] Error saving recording:', error);
      setLastAction({
        action: 'Save recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, [isRecording, stopRecording, setLastAction]);
  
  return {
    handleDelete,
    handleSaveRecording
  };
}
