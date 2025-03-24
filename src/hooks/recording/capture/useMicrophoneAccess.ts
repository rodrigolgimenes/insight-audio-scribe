
import { useState, useCallback } from "react";

/**
 * Hook to manage microphone access and device selection
 * Modified to remove all toast notifications
 */
export const useMicrophoneAccess = (
  checkPermissions: () => Promise<boolean>,
  captureSystemAudio: (stream: MediaStream, isSystemAudio: boolean) => Promise<MediaStream | null>
) => {
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  /**
   * Request access to the microphone with the selected device
   */
  const requestMicrophoneAccess = useCallback(
    async (deviceId: string | null, isSystemAudio: boolean = false): Promise<MediaStream | null> => {
      if (requestInProgress) {
        console.log("[useMicrophoneAccess] Request already in progress, ignoring duplicate");
        return null;
      }

      // Set flag to prevent duplicate requests
      setRequestInProgress(true);
      setAttemptCount(prev => prev + 1);
      
      console.log(`[useMicrophoneAccess] Requesting microphone access (attempt #${attemptCount + 1})`);
      console.log("[useMicrophoneAccess] Device ID:", deviceId);
      console.log("[useMicrophoneAccess] System audio:", isSystemAudio);

      try {
        // First, check for permissions
        const hasPermission = await checkPermissions();
        
        if (!hasPermission) {
          console.log("[useMicrophoneAccess] No permission to access microphone");
          setRequestInProgress(false);
          return null;
        }

        // Configure audio constraints with lower sample rate and sample size
        const constraints: MediaStreamConstraints = {
          audio: deviceId
            ? {
                deviceId: { exact: deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false,
                sampleRate: { ideal: 16000 },
                sampleSize: { ideal: 8 }
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false,
                sampleRate: { ideal: 16000 },
                sampleSize: { ideal: 8 }
              },
          video: false,
        };

        console.log("[useMicrophoneAccess] Using constraints:", JSON.stringify(constraints));

        // Request the media stream with a timeout to prevent hanging
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error("Microphone access request timed out")), 10000);
        });

        // Stream request with timeout
        const stream = await Promise.race([
          navigator.mediaDevices.getUserMedia(constraints),
          timeoutPromise
        ]);

        if (!stream) {
          throw new Error("Failed to get media stream");
        }

        console.log("[useMicrophoneAccess] Successfully acquired microphone stream");
        
        // Reset attempt counter on success
        setAttemptCount(0);

        // Log audio tracks info for debugging
        const tracks = stream.getAudioTracks();
        console.log(`[useMicrophoneAccess] Got ${tracks.length} audio tracks`);
        tracks.forEach((track, i) => {
          console.log(`[useMicrophoneAccess] Track ${i}: ${track.label}, enabled: ${track.enabled}`);
          
          // Log audio track settings to verify sample rate and sample size
          const settings = track.getSettings();
          console.log(`[useMicrophoneAccess] Track settings:`, settings);
          console.log(`[useMicrophoneAccess] Sample rate: ${settings.sampleRate || 'unknown'}`);
          console.log(`[useMicrophoneAccess] Sample size: ${settings.sampleSize || 'unknown'}`);
        });

        // If system audio capture is requested
        if (isSystemAudio) {
          console.log("[useMicrophoneAccess] Attempting to capture system audio");
          try {
            const combinedStream = await captureSystemAudio(stream, isSystemAudio);
            if (combinedStream) {
              setRequestInProgress(false);
              return combinedStream;
            }
            // If system audio fails, continue with just the mic stream
            console.warn("[useMicrophoneAccess] System audio failed, continuing with mic only");
          } catch (err) {
            console.error("[useMicrophoneAccess] System audio error:", err);
            // Continue with just the mic stream if system audio fails
          }
        }

        setRequestInProgress(false);
        return stream;
      } catch (error) {
        console.error("[useMicrophoneAccess] Error accessing microphone:", error);
        
        setRequestInProgress(false);
        return null;
      }
    },
    [captureSystemAudio, checkPermissions, attemptCount]
  );

  return {
    requestMicrophoneAccess,
    requestInProgress
  };
};
