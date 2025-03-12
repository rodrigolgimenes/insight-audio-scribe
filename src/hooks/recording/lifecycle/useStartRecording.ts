
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { RecordingStateType } from "../useRecordingState";
import { useAudioCapture } from "../useAudioCapture";

export function useStartRecording(
  recordingState: Pick<RecordingStateType, "setIsRecording" | "setIsPaused" | "setMediaStream" | "isSystemAudio">
) {
  const { requestMicrophoneAccess } = useAudioCapture();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  const handleStartRecording = useCallback(
    async (selectedDeviceId: string | null) => {
      console.log('[useStartRecording] Starting recording process with device:', selectedDeviceId);

      if (!selectedDeviceId) {
        console.error('[useStartRecording] No device selected for recording');
        toast({
          title: "Error",
          description: "Please select a microphone first.",
          variant: "destructive",
        });
        return;
      }

      if (!session?.user) {
        toast({
          title: "Error",
          description: "Please log in to record audio.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      try {
        console.log('[useStartRecording] Requesting microphone access');
        const stream = await requestMicrophoneAccess(selectedDeviceId, recordingState.isSystemAudio);
        if (!stream) {
          console.error('[useStartRecording] Failed to get media stream');
          return;
        }

        console.log('[useStartRecording] Got media stream:', stream.id);
        recordingState.setMediaStream(stream);
        
        // Return the stream for the recorder to use
        return stream;
      } catch (error) {
        console.error('[useStartRecording] Error accessing microphone:', error);
        toast({
          title: "Error",
          description: "Could not start recording. Please check your microphone settings and try again.",
          variant: "destructive",
        });
        return null;
      }
    },
    [
      navigate,
      requestMicrophoneAccess,
      recordingState.isSystemAudio,
      recordingState.setMediaStream,
      session,
      toast,
    ]
  );

  return handleStartRecording;
}
