
/**
 * Gets a mime type supported by the browser's MediaRecorder implementation
 */
export function getSupportedMimeType(): string {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/mpeg',
  ];
  
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  console.warn('[AudioRecorder] No supported mime types found, falling back to audio/webm');
  return 'audio/webm';
}

/**
 * Creates MediaRecorder options for the most compatible recording
 */
export function createMediaRecorderOptions(mimeType: string): MediaRecorderOptions {
  return {
    mimeType,
    audioBitsPerSecond: 128000
  };
}
