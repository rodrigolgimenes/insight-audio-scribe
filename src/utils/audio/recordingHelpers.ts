
export const logAudioTracks = (stream: MediaStream) => {
  const audioTracks = stream.getAudioTracks();
  console.log('[recordingHelpers] Audio tracks:', audioTracks.length);
  
  audioTracks.forEach((track, index) => {
    console.log(`[recordingHelpers] Track ${index}:`, {
      label: track.label,
      enabled: track.enabled,
      readyState: track.readyState,
      muted: track.muted,
      settings: track.getSettings()
    });
  });
};

export const validateAudioTracks = (stream: MediaStream) => {
  const audioTracks = stream.getAudioTracks();
  
  if (audioTracks.length === 0) {
    throw new Error('No audio tracks available in stream');
  }
  
  const disabledTracks = audioTracks.filter(track => !track.enabled);
  if (disabledTracks.length === audioTracks.length) {
    throw new Error('All audio tracks are disabled');
  }
  
  const endedTracks = audioTracks.filter(track => track.readyState === 'ended');
  if (endedTracks.length === audioTracks.length) {
    throw new Error('All audio tracks are ended');
  }
  
  return true;
};

export const stopMediaTracks = (stream: MediaStream | null) => {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    console.log(`[recordingHelpers] Stopping track: ${track.kind}/${track.label}`);
    track.stop();
  });
};
