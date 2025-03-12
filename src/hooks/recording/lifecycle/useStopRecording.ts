
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { RecordingStateType } from "../useRecordingState";
import { AudioRecorder } from "@/utils/audio/audioRecorder";

export function useStopRecording(
  recordingState: Pick<RecordingStateType, "setIsRecording" | "setIsPaused" | "setAudioUrl" | "setMediaStream" | "mediaStream">,
  recorder: React.RefObject<AudioRecorder>
) {
  const { toast } = useToast();

  const handleStopRecording = useCallback(async () => {
    try {
      console.log('[useStopRecording] Stopping recording');
      
      if (!recorder.current) {
        console.error('[useStopRecording] No recorder instance available');
        return { blob: null, duration: 0 };
      }
      
      const { blob, duration } = await recorder.current.stopRecording();
      
      recordingState.setIsRecording(false);
      recordingState.setIsPaused(false);
      
      if (recordingState.mediaStream) {
        console.log('[useStopRecording] Stopping media tracks');
        recordingState.mediaStream.getTracks().forEach(track => {
          track.stop();
        });
        recordingState.setMediaStream(null);
      }

      if (blob) {
        console.log('[useStopRecording] Creating audio URL from blob');
        const url = URL.createObjectURL(blob);
        recordingState.setAudioUrl(url);
        console.log('[useStopRecording] Recording stopped successfully with duration (seconds):', duration);
      } else {
        console.error('[useStopRecording] No blob returned from recorder');
      }

      return { blob, duration };
    } catch (error) {
      console.error('[useStopRecording] Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording. Please try again.",
        variant: "destructive",
      });
      return { blob: null, duration: 0 };
    }
  }, [recorder, recordingState, toast]);

  return handleStopRecording;
}
