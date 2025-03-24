
import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to manage microphone access and device selection
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
          console.error("[useMicrophoneAccess] No permission to access microphone");
          toast.error("Microphone access denied", {
            description: "Please allow microphone access and try again"
          });
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
                sampleRate: { ideal: 16000 }, // Reduced sample rate (16kHz)
                sampleSize: { ideal: 8 }      // Reduced sample size (8 bits)
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false,
                sampleRate: { ideal: 16000 }, // Reduced sample rate (16kHz)
                sampleSize: { ideal: 8 }      // Reduced sample size (8 bits)
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
        
        // Create a more specific error message
        let errorMessage = "Unknown error accessing microphone";
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            errorMessage = "Microphone permission denied";
          } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
            errorMessage = "No microphone found. Please connect a microphone and try again.";
          } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
            errorMessage = "Could not access microphone. It may be in use by another application.";
          } else if (error.name === "OverconstrainedError") {
            errorMessage = "The selected microphone is no longer available. Please try another device.";
          } else if (error.message.includes("timed out")) {
            errorMessage = "Microphone access request timed out. Please try again.";
          }
        }
        
        // Show toast with error message
        toast.error("Microphone access failed", {
          description: errorMessage
        });
        
        // Retry logic for certain errors
        if (attemptCount < 2 && error instanceof Error) {
          const retriableErrors = ["NotReadableError", "TrackStartError", "timeout"];
          const shouldRetry = retriableErrors.some(errType => 
            error.name === errType || error.message.includes(errType)
          );
          
          if (shouldRetry) {
            console.log("[useMicrophoneAccess] Scheduling retry attempt");
            setTimeout(() => {
              setRequestInProgress(false);
              // Fall back to default device on retry
              requestMicrophoneAccess(null, isSystemAudio);
            }, 1500);
            return null;
          }
        }
        
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
