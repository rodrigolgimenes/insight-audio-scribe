
import { toast } from "sonner";

/**
 * Show appropriate error toast based on the error type
 */
export const showPermissionErrorToast = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    toast.error("Microphone access denied", {
      description: "Please allow microphone access in your browser settings"
    });
  } else if (error instanceof DOMException && error.name === 'NotFoundError') {
    toast.error("No microphone found", {
      description: "Please connect a microphone and try again"
    });
  } else {
    toast.error("Microphone error", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

/**
 * Handle permission check via getUserMedia with timeout
 */
export const requestMicrophonePermission = async (timeoutMs: number = 10000): Promise<MediaStream> => {
  const streamPromise = navigator.mediaDevices.getUserMedia({ 
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false
    } 
  });
  
  const timeoutPromise = new Promise<MediaStream>((_, reject) => {
    setTimeout(() => reject(new Error("Permission request timed out")), timeoutMs);
  });
  
  return Promise.race([streamPromise, timeoutPromise]);
};

/**
 * Clean up media stream by stopping all tracks
 */
export const cleanupMediaStream = (stream: MediaStream) => {
  if (stream && stream.getTracks) {
    stream.getTracks().forEach(track => track.stop());
  }
};
