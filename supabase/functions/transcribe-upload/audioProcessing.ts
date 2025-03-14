
import { FFmpeg } from '@ffmpeg/ffmpeg';

export async function convertToMp3(ffmpeg: FFmpeg, inputFile: Uint8Array, inputFileName: string): Promise<Uint8Array> {
  const outputFileName = 'output.mp3';
  
  try {
    // Write input file to FFmpeg's virtual filesystem
    ffmpeg.writeFile(inputFileName, inputFile);
    console.log('File written to FFmpeg filesystem');

    // Run FFmpeg command to convert to MP3 (optimized for speech)
    await ffmpeg.exec([
      '-i', inputFileName,
      '-vn', // Disable video if present
      '-acodec', 'libmp3lame',
      '-ac', '1', // Convert to mono
      '-ar', '16000', // Downsample to 16kHz
      '-b:a', '32k', // Lower bitrate
      outputFileName
    ]);
    console.log('FFmpeg conversion completed');

    // Read the converted file
    const data = await ffmpeg.readFile(outputFileName);
    console.log('Converted file read from FFmpeg filesystem');

    return data;
  } catch (error) {
    console.error('Error in MP3 conversion:', error);
    
    // If conversion fails, return the original file
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
    // Write input file to FFmpeg's virtual filesystem
    ffmpeg.writeFile(inputFileName, inputFile);
    console.log('File written to FFmpeg filesystem for chunking');

    // Run FFmpeg command to split into segments
    await ffmpeg.exec([
      '-i', inputFileName,
      '-f', 'segment',
      '-segment_time', chunkDurationSeconds.toString(),
      '-reset_timestamps', '1',
      '-c', 'copy',
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
    }

    return chunks;
  } catch (error) {
    console.error('Error splitting audio into chunks:', error);
    // If chunking fails, return an array with just the original file
    return [inputFile];
  }
}
