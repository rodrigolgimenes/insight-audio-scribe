
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
      console.log('[useMicrophoneAccess] Starting with params:', { deviceId, isSystemAudio });
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio capture');
      }

      // Check permissions first
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        console.error('[useMicrophoneAccess] Permission denied');
        toast({
          title: "Error",
          description: "Microphone access denied. Please enable microphone permissions in your browser settings.",
          variant: "destructive",
        });
        return null;
      }

      if (!deviceId) {
        console.error('[useMicrophoneAccess] No device ID provided');
        toast({
          title: "Error",
          description: "Please select a microphone device first.",
          variant: "destructive",
        });
        return null;
      }

      console.log('[useMicrophoneAccess] Requesting microphone with device ID:', deviceId);
      
      // Create constraints based on the selected device
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
        },
        video: false
      };
      
      let micStream: MediaStream;
      
      try {
        console.log('[useMicrophoneAccess] Attempting with exact device ID constraint');
        micStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('[useMicrophoneAccess] Failed with exact device ID, trying fallback', err);
        
        // Fallback to simpler constraints if needed
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: deviceId },
          video: false
        });
      }
      
      // Check if we got audio tracks
      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.error('[useMicrophoneAccess] No audio tracks in stream');
        throw new Error('Failed to access microphone - no audio tracks');
      }
      
      console.log('[useMicrophoneAccess] Microphone stream obtained with tracks:', audioTracks.length);
      
      // Log track details for debugging
      audioTracks.forEach((track, index) => {
        console.log(`[useMicrophoneAccess] Track ${index}:`, {
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
      });

      // If system audio is requested, attempt to capture it
      if (isSystemAudio) {
        console.log('[useMicrophoneAccess] System audio requested, attempting capture...');
        
        try {
          const systemStream = await captureSystemAudio(micStream);
          
          if (systemStream) {
            console.log('[useMicrophoneAccess] System audio captured successfully');
            return systemStream;
          } else {
            console.warn('[useMicrophoneAccess] System audio capture returned null, falling back to mic only');
            return micStream;
          }
        } catch (systemError) {
          console.error('[useMicrophoneAccess] System audio capture failed:', systemError);
          toast({
            title: "Notice",
            description: "Could not capture system audio. Using microphone only.",
            variant: "default",
          });
          
          // Continue with just the microphone stream
          return micStream;
        }
      }

      // Return just the microphone stream if no system audio requested
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
