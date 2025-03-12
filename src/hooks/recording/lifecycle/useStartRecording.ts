
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
        return null;
      }

      if (!session?.user) {
        toast({
          title: "Error",
          description: "Please log in to record audio.",
          variant: "destructive",
        });
        navigate("/login");
        return null;
      }

      try {
        console.log('[useStartRecording] Requesting microphone access with device ID:', selectedDeviceId);
        const stream = await requestMicrophoneAccess(selectedDeviceId, recordingState.isSystemAudio);
        
        if (!stream) {
          console.error('[useStartRecording] Failed to get media stream');
          toast({
            title: "Error",
            description: "Could not access microphone. Please check your browser permissions.",
            variant: "destructive",
          });
          return null;
        }

        // Verify we have audio tracks before proceeding
        const audioTracks = stream.getAudioTracks();
        console.log('[useStartRecording] Got media stream with audio tracks:', audioTracks.length);
        
        if (audioTracks.length === 0) {
          console.error('[useStartRecording] Stream has no audio tracks');
          toast({
            title: "Error",
            description: "No audio detected from your microphone. Please try another device.",
            variant: "destructive",
          });
          return null;
        }

        // Store the stream in state for UI updates
        recordingState.setMediaStream(stream);
        console.log('[useStartRecording] Media stream set in state');
        
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
