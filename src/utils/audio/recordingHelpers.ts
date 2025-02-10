
import { AudioTrackInfo } from './types';

export const logAudioTracks = (stream: MediaStream): void => {
  const audioTracks = stream.getAudioTracks();
  console.log('[AudioRecorder] Audio tracks:', {
    count: audioTracks.length,
    tracks: audioTracks.map(track => ({
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState
    }))
  });
};

export const validateAudioTracks = (stream: MediaStream): void => {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    throw new Error('No audio tracks found in stream');
  }
};

export const stopMediaTracks = (stream: MediaStream): void => {
  stream.getTracks().forEach(track => {
    try {
      console.log('[AudioRecorder] Stopping track:', track.label);
      track.stop();
    } catch (error) {
      console.error('[AudioRecorder] Error stopping track:', error);
    }
  });
};
