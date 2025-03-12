
/**
 * Finds a supported MIME type for the MediaRecorder
 * @returns The first supported MIME type or empty string if none found
 */
export function getSupportedMimeType(): string {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];
  
  const selectedMimeType = mimeTypes.find(type => {
    try {
      const isSupported = MediaRecorder.isTypeSupported(type);
      console.log(`[MediaRecorderUtils] MIME type ${type} supported:`, isSupported);
      return isSupported;
    } catch (e) {
      console.warn(`[MediaRecorderUtils] Error checking mime type ${type}:`, e);
      return false;
    }
  });
  
  if (!selectedMimeType) {
    console.warn('[MediaRecorderUtils] No preferred mime types supported, using default');
    return '';
  }
  
  return selectedMimeType;
}

/**
 * Creates MediaRecorder options with optimal settings
 * @returns MediaRecorderOptions object
 */
export function createMediaRecorderOptions(mimeType: string): MediaRecorderOptions {
  return {
    mimeType: mimeType,
    audioBitsPerSecond: 128000
  };
}

/**
 * Logs information about audio tracks from a MediaStream
 * @param stream The MediaStream to analyze
 */
export function logAudioTracks(stream: MediaStream): void {
  const audioTracks = stream.getAudioTracks();
  console.log('[MediaRecorderUtils] Audio tracks:', {
    count: audioTracks.length,
    tracks: audioTracks.map(track => ({
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState
    }))
  });
}

/**
 * Verifies that a MediaStream has valid audio tracks
 * @param stream The MediaStream to verify
 * @throws Error if no audio tracks are found
 */
export function validateAudioTracks(stream: MediaStream): void {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    throw new Error('No audio tracks found in stream');
  }
}
