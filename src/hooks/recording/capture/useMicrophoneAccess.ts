
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

      console.log('[useMicrophoneAccess] Requesting microphone access with deviceId:', deviceId);

      // First try with exact device ID constraint
      let micStream: MediaStream;
      try {
        // Create deep copy of constraints to avoid reference issues
        const audioConstraints: MediaTrackConstraints = {
          ...JSON.parse(JSON.stringify(MIC_CONSTRAINTS.audio)),
          deviceId: deviceId ? { exact: deviceId } : undefined
        };

        console.log('[useMicrophoneAccess] Using constraints:', JSON.stringify(audioConstraints));
        
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false
        });
      } catch (micError) {
        console.warn('[useMicrophoneAccess] Failed with advanced constraints, trying basic config:', micError);
        // Fallback to basic constraints
        micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
          video: false 
        });
      }
      
      // Check if we got audio tracks
      if (!micStream || micStream.getAudioTracks().length === 0) {
        console.error('[useMicrophoneAccess] No audio tracks in stream');
        throw new Error('Failed to access microphone');
      }
      
      console.log('[useMicrophoneAccess] Microphone stream obtained:', {
        id: micStream.id,
        tracks: micStream.getAudioTracks().map(track => ({
          label: track.label,
          enabled: track.enabled,
          settings: track.getSettings()
        }))
      });

      // Try to capture system audio if needed
      if (isSystemAudio) {
        try {
          console.log('[useMicrophoneAccess] Attempting to capture system audio...');
          const systemStream = await captureSystemAudio(micStream);
          if (systemStream) {
            console.log('[useMicrophoneAccess] System audio captured successfully');
            return systemStream;
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
