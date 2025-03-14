
import { FFmpeg } from '@ffmpeg/ffmpeg';

/**
 * Convert any audio/video file to MP3 format optimized for transcription
 * @param ffmpeg The FFmpeg instance
 * @param inputFile The input file as Uint8Array
 * @param inputFileName The input file name
 * @returns Processed MP3 audio as Uint8Array
 */
export async function convertToMp3(
  ffmpeg: FFmpeg, 
  inputFile: Uint8Array, 
  inputFileName: string
): Promise<Uint8Array> {
  const outputFileName = 'output.mp3';
  
  try {
    // Write input file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile(inputFileName, inputFile);
    console.log('File written to FFmpeg filesystem');

    // Run FFmpeg command to convert to MP3 (optimized specifically for speech transcription)
    await ffmpeg.exec([
      '-i', inputFileName,
      '-vn',                // Disable video if present
      '-acodec', 'libmp3lame', // Use MP3 codec
      '-ac', '1',           // Convert to mono (optimal for speech)
      '-ar', '16000',       // Downsample to 16kHz (optimal for speech recognition)
      '-b:a', '32k',        // Lower bitrate (sufficient for speech)
      '-f', 'mp3',          // Force MP3 format
      '-y',                 // Overwrite without asking
      outputFileName
    ]);
    console.log('FFmpeg conversion completed');

    // Read the converted file
    const data = await ffmpeg.readFile(outputFileName);
    console.log('Converted file read from FFmpeg filesystem');
    
    // Cleanup temporary files
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
      console.log('Temporary files cleaned up');
    } catch (cleanupError) {
      console.warn('Error cleaning up temporary files:', cleanupError);
    }

    return data;
  } catch (error) {
    console.error('Error in MP3 conversion:', error);
    
    // If conversion fails, return the original file but log the error
    console.warn('Conversion failed, returning original file');
    return inputFile;
  }
}

/**
 * Split a large audio file into smaller chunks for processing
 * @param ffmpeg The FFmpeg instance
 * @param inputFile The input file as Uint8Array
 * @param inputFileName The input file name
 * @param chunkDurationSeconds The duration of each chunk in seconds
 * @returns Array of Uint8Array chunks
 */
export async function splitAudioIntoChunks(
  ffmpeg: FFmpeg, 
  inputFile: Uint8Array, 
  inputFileName: string,
  chunkDurationSeconds: number = 20 * 60 // Default to 20 minutes
): Promise<Uint8Array[]> {
  try {
    // First convert to optimized MP3 format for consistent chunking
    const optimizedMp3 = await convertToMp3(ffmpeg, inputFile, inputFileName);
    const optimizedFileName = 'optimized.mp3';
    
    // Write optimized file for chunking
    await ffmpeg.writeFile(optimizedFileName, optimizedMp3);
    console.log('Optimized file written to FFmpeg filesystem for chunking');

    // Run FFmpeg command to split into segments
    await ffmpeg.exec([
      '-i', optimizedFileName,
      '-f', 'segment',
      '-segment_time', chunkDurationSeconds.toString(),
      '-reset_timestamps', '1',
      '-c', 'copy',            // Copy codec (already optimized)
      'chunk_%03d.mp3'
    ]);
    console.log('FFmpeg chunking completed');

    // List all created chunks
    const files = await ffmpeg.listDir('./');
    const chunkFiles = files
      .filter(file => file.name.startsWith('chunk_') && file.name.endsWith('.mp3'))
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Created ${chunkFiles.length} audio chunks`);

    // Read all chunks into Uint8Array
    const chunks: Uint8Array[] = [];
    for (const file of chunkFiles) {
      const data = await ffmpeg.readFile(file.name);
      chunks.push(data);
      console.log(`Read chunk ${file.name}, size: ${data.byteLength} bytes`);
      
      // Clean up each chunk after reading
      try {
        await ffmpeg.deleteFile(file.name);
      } catch (cleanupError) {
        console.warn(`Error cleaning up chunk ${file.name}:`, cleanupError);
      }
    }
    
    // Clean up optimized file
    try {
      await ffmpeg.deleteFile(optimizedFileName);
    } catch (cleanupError) {
      console.warn(`Error cleaning up optimized file:`, cleanupError);
    }

    return chunks;
  } catch (error) {
    console.error('Error splitting audio into chunks:', error);
    
    // If chunking fails, try to just convert the file and return it as a single chunk
    try {
      const optimizedAudio = await convertToMp3(ffmpeg, inputFile, inputFileName);
      return [optimizedAudio];
    } catch (fallbackError) {
      console.error('Fallback conversion also failed:', fallbackError);
      // As last resort, return original file as a single chunk
      return [inputFile];
    }
  }
}
