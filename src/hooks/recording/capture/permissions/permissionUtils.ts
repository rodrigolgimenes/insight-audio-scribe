
import { toast } from "sonner";
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
 */
export const showPermissionErrorToast = (error: DOMException) => {
  console.log('[permissionUtils] Showing permission error toast for error:', error.name);
  
  switch (error.name) {
    case 'NotAllowedError':
      toast.error("Microphone access denied", {
        description: "Please allow microphone access in your browser settings"
      });
      break;
      
    case 'NotFoundError':
      toast.error("No microphone found", {
        description: "Please connect a microphone and try again"
      });
      break;
      
    case 'NotReadableError':
    case 'AbortError':
      toast.error("Cannot access microphone", {
        description: "Your microphone may be in use by another application"
      });
      break;
      
    case 'SecurityError':
      toast.error("Security error", {
        description: "Your browser blocked access to the microphone due to security settings"
      });
      break;
      
    default:
      toast.error("Microphone error", {
        description: error.message
      });
      break;
  }
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
 */
export const checkBrowserSupport = (): { supported: boolean; message: string } => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      message: "Your browser doesn't support audio recording. Please use Chrome, Firefox, or Edge."
    };
  }
  
  // Check for MediaRecorder
  if (typeof MediaRecorder === 'undefined') {
    return {
      supported: false,
      message: "Your browser doesn't support MediaRecorder. Please use Chrome, Firefox, or Edge."
    };
  }
  
  return { supported: true, message: "" };
};
