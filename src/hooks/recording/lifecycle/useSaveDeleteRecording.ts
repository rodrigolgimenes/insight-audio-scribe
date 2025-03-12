
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { RecordingStateType } from "../useRecordingState";
import { useAudioProcessing } from "../useAudioProcessing";
import { AudioRecorder } from "@/utils/audio/audioRecorder";

export function useSaveDeleteRecording(
  recordingState: Pick<RecordingStateType, 
    "setIsRecording" | "setIsPaused" | "setAudioUrl" | "setMediaStream" | 
    "mediaStream" | "audioUrl" | "setIsSaving" | "isRecording"
  >,
  recorder: React.RefObject<AudioRecorder>,
  handleStopRecording: () => Promise<{blob: Blob | null, duration: number}>
) {
  const { saveRecording } = useAudioProcessing();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  const handleDelete = useCallback(() => {
    console.log('[useSaveDeleteRecording] Deleting recording');
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
      recordingState.setAudioUrl(null);
    }
    
    if (recordingState.mediaStream) {
      recordingState.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      recordingState.setMediaStream(null);
    }
    
    recordingState.setIsRecording(false);
    recordingState.setIsPaused(false);
  }, [recordingState]);

  const handleSaveRecording = useCallback(async () => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You need to be logged in to save recordings.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    recordingState.setIsSaving(true);
    try {
      let blob, duration;
      
      if (recordingState.isRecording) {
        console.log('[useSaveDeleteRecording] Stopping recording before saving');
        const result = await handleStopRecording();
        blob = result.blob;
        duration = result.duration;
      } else if (recorder.current?.isCurrentlyRecording()) {
        console.log('[useSaveDeleteRecording] Recorder is still active, stopping');
        const result = await recorder.current.stopRecording();
        blob = result.blob;
        duration = result.duration;
      } else {
        console.log('[useSaveDeleteRecording] Getting current recording state for saving');
        blob = recorder.current?.getFinalBlob?.() || null;
        duration = recorder.current?.getCurrentDuration() || 0;
      }
      
      if (!blob) {
        console.error('[useSaveDeleteRecording] No blob available for saving');
        throw new Error('Could not get audio to save');
      }
      
      console.log('[useSaveDeleteRecording] Saving recording with duration (seconds):', duration);
      const success = await saveRecording(session.user.id, blob, duration);
      
      if (success) {
        navigate("/app");
      }
    } catch (error) {
      console.error('[useSaveDeleteRecording] Error saving recording:', error);
      toast({
        title: "Error",
        description: "Failed to save the recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      recordingState.setIsSaving(false);
    }
  }, [
    handleStopRecording, 
    navigate, 
    recorder, 
    recordingState, 
    saveRecording, 
    session, 
    toast
  ]);

  return { handleDelete, handleSaveRecording };
}
