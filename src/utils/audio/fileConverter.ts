
import { convertAudioBufferToMp3 } from '@/lib/audioConverter';

// Function to convert a file to MP3 format
export async function convertFileToMp3(
  file: File, 
  onProgress?: (percentage: number) => void
): Promise<Blob> {
  try {
    console.log('Converting file to MP3:', file.name, file.type, file.size);
    
    // Skip conversion if already MP3
    if (file.type === 'audio/mp3' || file.type === 'audio/mpeg') {
      console.log('File is already MP3, returning original');
      return file;
    }
    
    // Create AudioContext for decoding
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Show progress for decoding
    if (onProgress) {
      onProgress(10);
    }
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    if (onProgress) {
      onProgress(30);
    }
    
    console.log('Audio decoded successfully:', 
      audioBuffer.numberOfChannels, 'channels,', 
      audioBuffer.sampleRate, 'Hz,',
      audioBuffer.length, 'samples,',
      audioBuffer.duration.toFixed(2), 'seconds');
    
    // Convert to MP3 with progress updates
    const mp3Data = await convertAudioBufferToMp3(
      audioBuffer,
      32, // 32kbps quality for maximum compression
      (progress) => {
        if (onProgress) {
          // Scale progress from 30-90% (reserving beginning and end for other operations)
          onProgress(30 + Math.floor(progress * 0.6));
        }
      }
    );
    
    if (onProgress) {
      onProgress(95);
    }
    
    // Create a Blob from the MP3 buffer
    const mp3Blob = new Blob([mp3Data.buffer], { type: 'audio/mp3' });
    
    if (onProgress) {
      onProgress(100);
    }
    
    console.log('MP3 conversion complete, size:', Math.round(mp3Blob.size / 1024), 'KB');
    
    return mp3Blob;
  } catch (error) {
    console.error('Error converting file to MP3:', error);
    throw error;
  }
}
