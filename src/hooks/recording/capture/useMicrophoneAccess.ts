
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { handleAudioError } from "../audioErrorHandler";
import { toast } from "sonner";

export const useMicrophoneAccess = (
  checkPermissions: () => Promise<boolean>,
  captureSystemAudio: (micStream: MediaStream, isSystemAudio: boolean) => Promise<MediaStream | null>
) => {
  const { toast: legacyToast } = useToast();

  const requestMicrophoneAccess = useCallback(async (deviceId: string | null, isSystemAudio: boolean): Promise<MediaStream | null> => {
    try {
      console.log('[useMicrophoneAccess] Starting with params:', { deviceId, isSystemAudio });
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio capture');
      }

      // Check permissions first
      let hasPermission = true;
      try {
        hasPermission = await checkPermissions();
      } catch (permError) {
        console.warn('[useMicrophoneAccess] Permission check failed, will try direct access:', permError);
      }
      
      if (!hasPermission) {
        console.warn('[useMicrophoneAccess] Permission check returned false, will try direct access anyway');
      }

      console.log('[useMicrophoneAccess] Requesting microphone...');
      
      // Create constraints based on the selected device or use default
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? 
          { deviceId: { ideal: deviceId } } : 
          { 
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true }
          },
        video: false
      };
      
      let micStream: MediaStream;
      
      try {
        console.log('[useMicrophoneAccess] Attempting with constraints:', constraints);
        micStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('[useMicrophoneAccess] Failed with specific constraints, trying generic audio access', err);
        
        // Fallback to generic audio constraints
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
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
      
      toast.success("Microphone access granted", {
        description: audioTracks[0].label || "Default microphone"
      });

      // If system audio is requested, attempt to capture it
      if (isSystemAudio) {
        console.log('[useMicrophoneAccess] System audio requested, attempting capture...');
        
        try {
          const systemStream = await captureSystemAudio(micStream, isSystemAudio);
          
          if (systemStream) {
            console.log('[useMicrophoneAccess] System audio captured successfully');
            toast.success("System audio captured successfully");
            return systemStream;
          } else {
            console.warn('[useMicrophoneAccess] System audio capture returned null, falling back to mic only');
            return micStream;
          }
        } catch (systemError) {
          console.error('[useMicrophoneAccess] System audio capture failed:', systemError);
          toast.error("Could not capture system audio. Using microphone only.");
          
          // Continue with just the microphone stream
          return micStream;
        }
      }

      // Return just the microphone stream if no system audio requested
      return micStream;
    } catch (error) {
      console.error('[useMicrophoneAccess] Error accessing audio:', error);
      
      toast.error("Microphone access error", {
        description: handleAudioError(error, isSystemAudio)
      });
      
      return null;
    }
  }, [checkPermissions, captureSystemAudio]);

  return {
    requestMicrophoneAccess
  };
};
