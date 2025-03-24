
export const RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp3',
  'audio/mpeg'
];

export const getMediaRecorderOptions = (): MediaRecorderOptions => {
  console.log('[AudioRecorder] Checking supported MIME types...');
  
  const selectedMimeType = RECORDING_MIME_TYPES.find(type => {
    try {
      const isSupported = MediaRecorder.isTypeSupported(type);
      console.log(`[AudioRecorder] MIME type ${type} supported:`, isSupported);
      return isSupported;
    } catch (e) {
      console.warn(`[AudioRecorder] Error checking mime type ${type}:`, e);
      return false;
    }
  });

  if (!selectedMimeType) {
    console.error('[AudioRecorder] No supported MIME type found');
    throw new Error('No supported audio format found. Please try a different browser.');
  }

  console.log('[AudioRecorder] Selected MIME type:', selectedMimeType);

  // Reduced bitrate for better compression (optimized for voice recording)
  // Using 32kbps which is sufficient for voice while maintaining quality
  // Now combined with lower sample rate (16kHz) and smaller sample size (8-bit)
  return {
    mimeType: selectedMimeType,
    audioBitsPerSecond: 32000  // 32kbps for voice
  };
};
