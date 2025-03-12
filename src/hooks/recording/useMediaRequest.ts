
import { useToast } from "@/hooks/use-toast";
import { useSystemAudio } from "./useSystemAudio";
import { handleAudioError } from "./audioErrorHandler";
import { MIC_CONSTRAINTS } from "./audioConfig";

export const useMediaRequest = () => {
  const { toast } = useToast();
  const { captureSystemAudio } = useSystemAudio();

  const requestMicrophoneAccess = async (deviceId: string | null, isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio capture');
      }

      console.log('[useMediaRequest] Requesting microphone access:', {
        deviceId,
        isSystemAudio
      });

      let micStream: MediaStream;
      try {
        const audioConstraints: MediaTrackConstraints = {
          ...MIC_CONSTRAINTS.audio as MediaTrackConstraints,
          deviceId: deviceId ? { exact: deviceId } : undefined
        };

        micStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false
        });
        
        console.log('[useMediaRequest] Microphone stream obtained:', {
          tracks: micStream.getAudioTracks().map(track => ({
            label: track.label,
            enabled: track.enabled,
            settings: track.getSettings()
          }))
        });
      } catch (micError) {
        console.warn('[useMediaRequest] Failed with advanced constraints, trying basic config:', micError);
        micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false 
        });
      }

      // First capture the microphone stream
      if (!micStream) {
        throw new Error('Failed to get microphone stream');
      }

      // Then, if system audio is enabled, capture system audio and mix with microphone
      if (isSystemAudio) {
        try {
          console.log('[useMediaRequest] Attempting to capture system audio...');
          const systemStream = await captureSystemAudio(micStream);
          if (systemStream) {
            console.log('[useMediaRequest] System audio captured successfully');
            return systemStream;
          }
        } catch (systemError) {
          console.error('[useMediaRequest] Failed to capture system audio:', systemError);
          toast({
            title: "Warning",
            description: "Could not capture system audio. Using microphone only.",
            variant: "default",
          });
          // If system audio capture fails, still return the microphone stream
          return micStream;
        }
      }

      // If system audio wasn't requested or failed, return the microphone stream
      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio source available');
      }

      console.log('[useMediaRequest] Final audio stream details:', {
        id: micStream.id,
        active: micStream.active,
        trackCount: audioTracks.length,
        tracks: audioTracks.map(track => ({
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          settings: track.getSettings()
        }))
      });

      return micStream;
    } catch (error) {
      console.error('[useMediaRequest] Error accessing audio:', error);
      
      toast({
        title: "Capture Error",
        description: handleAudioError(error, isSystemAudio),
        variant: "destructive",
      });
      
      return null;
    }
  };

  return {
    requestMicrophoneAccess
  };
};
