
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
    } else if (error.message.includes('No audio tracks available') || error.message.includes('Nenhuma trilha')) {
      errorMessage = 'Select a source with audio when sharing your screen';
    } else {
      errorMessage = error.message;
    }
  }

  return isSystemAudio 
    ? `Could not capture system audio: ${errorMessage}`
    : `Could not access microphone: ${errorMessage}`;
};
