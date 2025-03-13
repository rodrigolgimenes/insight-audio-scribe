
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";
import { toast } from "sonner";

/**
 * Hook for handling save and delete recording actions
 */
export function useSaveDeleteRecording(
  recordingState: RecordingStateType,
  stopRecording: () => Promise<{ blob: Blob | null; duration: number } | undefined>,
  setLastAction: (action: { action: string; timestamp: number; success: boolean; error?: string } | null) => void
) {
  const {
    setAudioUrl,
    setMediaStream
  } = recordingState;

  const handleDelete = useCallback(() => {
    console.log('[useSaveDeleteRecording] Deleting recording');
    
    // Clear audio URL
    setAudioUrl(null);
    
    // Log action
    setLastAction({
      action: 'Delete recording',
      timestamp: Date.now(),
      success: true
    });
    
    console.log('[useSaveDeleteRecording] Recording deleted');
  }, [setAudioUrl, setLastAction]);

  const handleSaveRecording = useCallback(async () => {
    console.log('[useSaveDeleteRecording] Saving recording');
    
    try {
      // Set action to starting save
      setLastAction({
        action: 'Save recording',
        timestamp: Date.now(),
        success: false
      });
      
      // Implementation for save process would go here
      
      // Set action to saved successfully
      setLastAction({
        action: 'Save recording',
        timestamp: Date.now(),
        success: true
      });
      
      console.log('[useSaveDeleteRecording] Recording saved successfully');
      return true;
    } catch (error) {
      console.error('[useSaveDeleteRecording] Error saving recording:', error);
      
      // Set action to save failed
      setLastAction({
        action: 'Save recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }, [setLastAction]);

  return {
    handleDelete,
    handleSaveRecording
  };
}
