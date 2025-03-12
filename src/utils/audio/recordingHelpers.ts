
/**
 * Logs detailed information about audio tracks in a stream
 */
export function logAudioTracks(stream: MediaStream): void {
  const audioTracks = stream.getAudioTracks();
  console.log('[AudioRecorder] Audio tracks found:', audioTracks.length);
  
  if (audioTracks.length === 0) {
    console.warn('[AudioRecorder] No audio tracks in stream');
    return;
  }
  
  audioTracks.forEach((track, index) => {
    console.log(`[AudioRecorder] Track ${index}:`, { 
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      settings: track.getSettings()
    });
  });
}

/**
 * Validates that a stream has audio tracks
 * @throws Error if no audio tracks are found
 */
export function validateAudioTracks(stream: MediaStream): void {
  const audioTracks = stream.getAudioTracks();
  
  if (audioTracks.length === 0) {
    console.error('[AudioRecorder] No audio tracks found in stream');
    throw new Error('No audio tracks found in the provided stream');
  }
  
  // Check for enabled tracks
  const enabledTracks = audioTracks.filter(track => track.enabled);
  if (enabledTracks.length === 0) {
    console.warn('[AudioRecorder] No enabled audio tracks found in stream');
  }
}
