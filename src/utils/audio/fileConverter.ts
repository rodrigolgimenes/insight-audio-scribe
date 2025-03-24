
import { convertAudioBufferToMp3 } from '@/lib/audioConverter';
import { log, logLameJS, logWorker, logData, logFormat, logValidation, logSuccess, logError } from '@/lib/logger';

// Function to convert a file to MP3 format
export async function convertFileToMp3(
  file: File, 
  onProgress?: (percentage: number) => void
): Promise<File> {
  try {
    log('Converting file to MP3: ' + file.name + ', type: ' + file.type + ', size: ' + (file.size / (1024 * 1024)).toFixed(2) + ' MB');
    
    // Skip conversion if already MP3
    if (file.type === 'audio/mp3' || file.type === 'audio/mpeg') {
      log('File is already MP3, returning original');
      return file;
    }
    
    // Create AudioContext for decoding
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    log('File read as ArrayBuffer successfully, size: ' + (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2) + ' MB');
    
    // Show progress for decoding
    if (onProgress) {
      onProgress(10);
    }
    
    // Decode audio data
    log('Starting audio decoding...');
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    if (onProgress) {
      onProgress(30);
    }
    
    logFormat(`Audio decoded successfully: 
      ${audioBuffer.numberOfChannels} channels, 
      ${audioBuffer.sampleRate} Hz, 
      ${audioBuffer.length} samples, 
      ${audioBuffer.duration.toFixed(2)} seconds`);
    
    // Convert to MP3 with progress updates
    logLameJS('Starting MP3 conversion process with quality 32kbps');
    const mp3Data = await convertAudioBufferToMp3(
      audioBuffer,
      32, // 32kbps quality for maximum compression
      (progress) => {
        if (onProgress) {
          // Scale progress from 30-90% (reserving beginning and end for other operations)
          onProgress(30 + Math.floor(progress * 0.6));
          
          // Add detailed logging at important progress points
          if (progress % 20 === 0) {
            logWorker(`MP3 encoding progress: ${progress}%`);
          }
        }
      }
    );
    
    if (onProgress) {
      onProgress(95);
    }
    
    // Create a Blob from the MP3 buffer
    const mp3Blob = new Blob([mp3Data.buffer], { type: 'audio/mp3' });
    
    // Convert the Blob to a File object to maintain compatibility
    const fileName = file.name.replace(/\.[^/.]+$/, "") + ".mp3";
    const mp3File = new File([mp3Blob], fileName, { 
      type: 'audio/mp3',
      lastModified: Date.now()
    });
    
    if (onProgress) {
      onProgress(100);
    }
    
    const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const newSizeMB = (mp3File.size / (1024 * 1024)).toFixed(2);
    const compressionRate = Math.round((1 - (mp3File.size / file.size)) * 100);
    
    logSuccess(`MP3 conversion completed successfully.
      Original: ${originalSizeMB} MB (${file.type})
      Converted: ${newSizeMB} MB (MP3)
      Compression rate: ${compressionRate}%`);
    
    log(`Encoded MP3 file details: size: ${Math.round(mp3File.size / 1024)} KB, name: ${fileName}`);
    
    return mp3File;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Error converting file to MP3: ' + errorMessage);
    throw error;
  }
}
