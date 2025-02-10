
import { FFmpeg } from '@ffmpeg/ffmpeg';

export async function convertToMp3(ffmpeg: FFmpeg, inputFile: Uint8Array, inputFileName: string): Promise<Uint8Array> {
  const outputFileName = 'output.mp3';
  
  // Write input file to FFmpeg's virtual filesystem
  ffmpeg.writeFile(inputFileName, inputFile);
  console.log('File written to FFmpeg filesystem');

  // Run FFmpeg command to convert to MP3
  await ffmpeg.exec([
    '-i', inputFileName,
    '-vn', // Disable video if present
    '-acodec', 'libmp3lame',
    '-ar', '44100',
    '-ac', '2',
    '-b:a', '128k',
    outputFileName
  ]);
  console.log('FFmpeg conversion completed');

  // Read the converted file
  const data = await ffmpeg.readFile(outputFileName);
  console.log('Converted file read from FFmpeg filesystem');

  return data;
}
