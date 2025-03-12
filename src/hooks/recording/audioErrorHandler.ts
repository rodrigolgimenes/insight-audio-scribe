
export const handleAudioError = (error: unknown, isSystemAudio: boolean): string => {
  let errorMessage = 'Unknown error';
  
  if (error instanceof Error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = 'Microphone permission denied';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = 'No microphone found';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = 'The microphone may be in use by another application';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Audio configuration not supported. Try disconnecting and reconnecting your USB device';
    } else if (error.name === 'AbortError') {
      errorMessage = 'The operation was aborted, possibly due to hardware changes during access';
    } else if (error.name === 'SecurityError') {
      errorMessage = 'The operation is insecure in the current context. Check browser security settings';
    } else if (error.name === 'TypeError') {
      errorMessage = 'Invalid parameters for audio access. Try with different audio settings';
    } else if (error.message.includes('No audio tracks available') || error.message.includes('Nenhuma trilha')) {
      errorMessage = 'Select a source with audio when sharing your screen';
    } else {
      errorMessage = error.message;
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = 'Device error: ' + (JSON.stringify(error) || 'Unknown object error');
  }

  return isSystemAudio 
    ? `Could not capture system audio: ${errorMessage}`
    : `Could not access microphone: ${errorMessage}`;
};

// Additional helper for device and permission troubleshooting
export const getDeviceTroubleshootingMessage = (error: unknown): string => {
  if (error instanceof Error) {
    switch (error.name) {
      case 'NotFoundError':
        return 'No microphone detected. Please check your connections or try a different microphone.';
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Microphone permission denied. Please check your browser settings and allow microphone access.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Cannot access microphone. It may be in use by another application or disconnected.';
      case 'OverconstrainedError':
        return 'Your microphone doesn\'t meet the required constraints. Try a different device.';
      case 'AbortError':
        return 'Device access was interrupted. Try reconnecting your microphone or refreshing the page.';
      default:
        return `Microphone error (${error.name}): ${error.message}`;
    }
  }
  return 'Unknown microphone error. Try a different device or browser.';
};
