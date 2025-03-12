
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
        toast({
          title: "Error",
          description: "Microphone access denied. Please enable microphone permissions in your browser settings.",
          variant: "destructive",
        });
        return null;
      }

      console.log('[useMicrophoneAccess] Requesting microphone access with deviceId:', deviceId);

      // First try with exact device ID constraint - fallbacks if needed
      let micStream: MediaStream | null = null;
      
      const attempts = [
        // Attempt 1: Try with full constraints and exact device ID
        async () => {
          if (!deviceId) return null;
          console.log('[useMicrophoneAccess] Attempt 1: Using full constraints with exact device ID');
          
          // Create empty audio constraints object
          const audioConstraints: MediaTrackConstraints = {
            deviceId: { exact: deviceId }
          };
          
          // Only add these properties if MIC_CONSTRAINTS.audio is an object
          if (typeof MIC_CONSTRAINTS.audio === 'object' && MIC_CONSTRAINTS.audio !== null) {
            if ('echoCancellation' in MIC_CONSTRAINTS.audio) 
              audioConstraints.echoCancellation = MIC_CONSTRAINTS.audio.echoCancellation;
            if ('noiseSuppression' in MIC_CONSTRAINTS.audio) 
              audioConstraints.noiseSuppression = MIC_CONSTRAINTS.audio.noiseSuppression;
            if ('autoGainControl' in MIC_CONSTRAINTS.audio) 
              audioConstraints.autoGainControl = MIC_CONSTRAINTS.audio.autoGainControl;
            if ('channelCount' in MIC_CONSTRAINTS.audio) 
              audioConstraints.channelCount = MIC_CONSTRAINTS.audio.channelCount;
            if ('sampleRate' in MIC_CONSTRAINTS.audio) 
              audioConstraints.sampleRate = MIC_CONSTRAINTS.audio.sampleRate;
            if ('sampleSize' in MIC_CONSTRAINTS.audio) 
              audioConstraints.sampleSize = MIC_CONSTRAINTS.audio.sampleSize;
          }
          
          return await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: false
          });
        },
        
        // Attempt 2: Try with only device ID constraint
        async () => {
          if (!deviceId) return null;
          console.log('[useMicrophoneAccess] Attempt 2: Using only device ID constraint');
          return await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId } },
            video: false
          });
        },
        
        // Attempt 3: Try with ideal device ID (non-exact)
        async () => {
          if (!deviceId) return null;
          console.log('[useMicrophoneAccess] Attempt 3: Using ideal device ID (non-exact)');
          return await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { ideal: deviceId } },
            video: false
          });
        },
        
        // Attempt 4: Just try with simple audio: true
        async () => {
          console.log('[useMicrophoneAccess] Attempt 4: Using audio: true as last resort');
          return await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
        }
      ];
      
      // Try each method until one works
      for (const attemptFn of attempts) {
        try {
          const stream = await attemptFn();
          if (stream && stream.getAudioTracks().length > 0) {
            micStream = stream;
            break;
          }
        } catch (err) {
          console.warn('[useMicrophoneAccess] Attempt failed, trying next method:', err);
        }
      }
      
      if (!micStream) {
        console.error('[useMicrophoneAccess] All attempts to get microphone stream failed');
        throw new Error('Failed to access microphone after multiple attempts');
      }
      
      // Check if we got audio tracks
      const audioTracks = micStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.error('[useMicrophoneAccess] No audio tracks in stream');
        throw new Error('Failed to access microphone - no audio tracks');
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
