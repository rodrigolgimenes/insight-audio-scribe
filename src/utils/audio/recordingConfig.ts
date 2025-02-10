
export const RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4'
];

export const getMediaRecorderOptions = (): MediaRecorderOptions => {
  const selectedMimeType = RECORDING_MIME_TYPES.find(type => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch (e) {
      console.warn(`[AudioRecorder] Error checking mime type ${type}:`, e);
      return false;
    }
  }) || '';

  console.log('[AudioRecorder] Selected MIME type:', selectedMimeType);

  return {
    mimeType: selectedMimeType,
    audioBitsPerSecond: 128000
  };
};
