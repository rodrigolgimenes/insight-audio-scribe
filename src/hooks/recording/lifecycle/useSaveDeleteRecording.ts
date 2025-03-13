
import { useCallback } from "react";
import { RecordingStateType } from "../useRecordingState";

export const useSaveDeleteRecording = (
  recordingState: RecordingStateType,
  stopRecording: () => Promise<any>
) => {
  const handleDelete = useCallback(() => {
    console.log('[useSaveDeleteRecording] Deleting recording');
    recordingState.setAudioUrl(null);
    recordingState.setAudioFileSize(null);
    
    // Update last action if the function exists
    if (recordingState.setLastAction) {
      recordingState.setLastAction({
        action: 'delete',
        timestamp: Date.now(),
        success: true
      });
    }
  }, [recordingState]);

  const handleSaveRecording = useCallback(() => {
    console.log('[useSaveDeleteRecording] Saving recording');
    recordingState.setIsSaving(true);
    
    // Update last action if the function exists
    if (recordingState.setLastAction) {
      recordingState.setLastAction({
        action: 'save',
        timestamp: Date.now(),
        success: true
      });
    }
    
    // Simulated save operation
    setTimeout(() => {
      recordingState.setIsSaving(false);
      recordingState.setIsTranscribing(true);
      
      // Simulated transcription operation
      setTimeout(() => {
        recordingState.setIsTranscribing(false);
      }, 2000);
    }, 1500);
  }, [recordingState]);

  return { handleDelete, handleSaveRecording };
};
