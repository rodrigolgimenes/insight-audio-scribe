
import { MIC_CONSTRAINTS } from "../../audioConfig";

/**
 * Request microphone permission by attempting to open a stream
 */
export const requestMicrophonePermission = async (): Promise<MediaStream> => {
  console.log('[permissionUtils] Requesting microphone permission with constraints:', MIC_CONSTRAINTS);
  try {
    // Try with our detailed constraints first
    return await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
  } catch (error) {
    console.warn('[permissionUtils] Failed with detailed constraints, trying simple constraints');
    
    // If that fails, try with simple constraints
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (simpleFallbackError) {
      console.error('[permissionUtils] Both constraint sets failed:', simpleFallbackError);
      throw simpleFallbackError; // Re-throw the simpler error for better messaging
    }
  }
};

/**
 * Show appropriate error toast based on the DOMException
 * This function is now completely disabled to prevent showing any toasts
 */
export const showPermissionErrorToast = (error: DOMException) => {
  // Disabled completely to prevent showing any microfone-related toasts
  console.log('[permissionUtils] Permission error occurred but toasts are disabled:', error.name);
};

/**
 * Clean up a media stream by stopping all tracks
 */
export const cleanupMediaStream = (stream: MediaStream) => {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    console.log('[permissionUtils] Stopping track:', track.kind, track.label);
    track.stop();
  });
};

/**
 * Check if the browser supports the needed APIs for microphone access
 * Always return supported=true to prevent showing error messages
 */
export const checkBrowserSupport = (): { supported: boolean; message: string } => {
  // Always return supported regardless of actual support
  // This prevents all browser support error messages
  return { supported: true, message: "" };
};
