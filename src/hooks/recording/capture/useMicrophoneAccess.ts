
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { handleAudioError } from "../audioErrorHandler";
import { MIC_CONSTRAINTS } from "../audioConfig";

export const useMicrophoneAccess = (
  checkPermissions: () => Promise<boolean>,
  captureSystemAudio: (micStream: MediaStream) => Promise<MediaStream | null>
) => {
  const { toast } = useToast();

  const requestMicrophoneAccess = useCallback(async (deviceId: string | null, isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio capture');
      }

      // Make sure we have permission first
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        console.error('[useMicrophoneAccess] Cannot access microphone without permission');
        return null;
      }

      console.log('[useMicrophoneAccess] Requesting microphone access:', {
        deviceId,
        isSystemAudio
      });

      let micStream: MediaStream;
      try {
        // Use exact device ID constraint if available
        const audioConstraints: MediaTrackConstraints = {
          ...MIC_CONSTRAINTS.audio as MediaTrackConstraints,
          deviceId: deviceId ? { exact: deviceId } : undefined
        };

        console.log('[useMicrophoneAccess] Using constraints:', JSON.stringify(audioConstraints));
        
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false
        });
        
        // Check if we actually got any tracks
        if (!micStream || micStream.getAudioTracks().length === 0) {
          throw new Error('Failed to access the selected microphone');
        }
        
        console.log('[useMicrophoneAccess] Microphone stream obtained:', {
          tracks: micStream.getAudioTracks().map(track => ({
            label: track.label,
            enabled: track.enabled,
            settings: track.getSettings()
          }))
        });
      } catch (micError) {
        console.warn('[useMicrophoneAccess] Failed with advanced constraints, trying basic config:', micError);
        // Fallback to basic constraints
        micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false 
        });
        
        if (!micStream || micStream.getAudioTracks().length === 0) {
          throw new Error('Failed to access microphone');
        }
      }

      if (isSystemAudio) {
        try {
          console.log('[useMicrophoneAccess] Attempting to capture system audio...');
          const systemStream = await captureSystemAudio(micStream);
          if (systemStream) {
            console.log('[useMicrophoneAccess] System audio captured successfully');
            micStream = systemStream;
          }
        } catch (systemError) {
          console.error('[useMicrophoneAccess] Failed to capture system audio:', systemError);
          toast({
            title: "Notice",
            description: "Could not capture system audio. Using microphone only.",
            variant: "default",
          });
        }
      }

      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('Failed to capture audio from the selected device');
      }

      console.log('[useMicrophoneAccess] Final audio stream details:', {
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
      console.error('[useMicrophoneAccess] Error accessing audio:', error);
      
      toast({
        title: "Error",
        description: handleAudioError(error, isSystemAudio),
        variant: "destructive",
      });
      
      return null;
    }
  }, [checkPermissions, captureSystemAudio, toast]);

  return {
    requestMicrophoneAccess
  };
};
