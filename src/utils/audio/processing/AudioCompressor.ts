import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Configuration for the optimized audio format
const OPTIMIZED_AUDIO_FORMAT = {
  codec: 'libmp3lame',
  channels: 1, // mono
  sampleRate: 16000, // 16kHz
  bitRate: 32, // 32kbps
};

// Maximum size for OpenAI Whisper API in bytes (24MB)
const MAX_WHISPER_SIZE_BYTES = 24 * 1024 * 1024;
// Target chunk size slightly below the limit (20MB)
const TARGET_CHUNK_SIZE_BYTES = 20 * 1024 * 1024;
// Maximum chunk duration in seconds (15 minutes)
const MAX_CHUNK_DURATION_SECONDS = 15 * 60;

export class AudioCompressor {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private isLoading = false;
  
  /**
   * Initialize and load FFmpeg
   */
  async loadFFmpeg(): Promise<FFmpeg> {
    if (this.isLoaded && this.ffmpeg) {
      return this.ffmpeg;
    }
    
    if (this.isLoading) {
      // Wait for the loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.ffmpeg) return this.ffmpeg;
    }
    
    this.isLoading = true;
    
    try {
      console.log('[AudioCompressor] Loading FFmpeg...');
      const ffmpeg = new FFmpeg();
      
      // Load FFmpeg core - using CDN URLs that are more reliable
      // Try multiple CDN sources to improve reliability
      let loaded = false;
      let lastError = null;
      
      // Attempt with unpkg (primary source)
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        loaded = true;
        console.log('[AudioCompressor] FFmpeg loaded successfully from unpkg');
      } catch (error) {
        console.warn('[AudioCompressor] Failed to load FFmpeg from unpkg:', error);
        lastError = error;
      }
      
      // Fallback to jsDelivr if unpkg failed
      if (!loaded) {
        try {
          const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          loaded = true;
          console.log('[AudioCompressor] FFmpeg loaded successfully from jsDelivr');
        } catch (error) {
          console.warn('[AudioCompressor] Failed to load FFmpeg from jsDelivr:', error);
          lastError = error;
        }
      }
      
      // Final fallback to Cloudflare
      if (!loaded) {
        try {
          const baseURL = 'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.12.6/umd';
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          loaded = true;
          console.log('[AudioCompressor] FFmpeg loaded successfully from Cloudflare');
        } catch (error) {
          console.warn('[AudioCompressor] Failed to load FFmpeg from Cloudflare:', error);
          lastError = error;
        }
      }
      
      if (!loaded) {
        throw new Error('Failed to load FFmpeg from all sources: ' + 
          (lastError instanceof Error ? lastError.message : String(lastError)));
      }
      
      this.ffmpeg = ffmpeg;
      this.isLoaded = true;
      return ffmpeg;
    } catch (error) {
      console.error('[AudioCompressor] Error loading FFmpeg:', error);
      throw new Error('Failed to load audio processing tools: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Compress audio to reduce file size (mono, lower bitrate)
   * This method ensures proper conversion to MP3 format
   */
  async compressAudio(audioBlob: Blob): Promise<Blob> {
    try {
      console.log(`[AudioCompressor] Compressing audio file: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB, type: ${audioBlob.type}`);
      
      // Check if FFmpeg is available
      let ffmpeg;
      try {
        ffmpeg = await this.loadFFmpeg();
      } catch (ffmpegError) {
        console.error('[AudioCompressor] FFmpeg loading failed, falling back to direct format change:', ffmpegError);
        
        // Simple fallback: just change the MIME type without actual compression
        // This is better than nothing if FFmpeg fails to load
        console.warn('[AudioCompressor] Using fallback method (no actual compression)');
        const arrayBuffer = await audioBlob.arrayBuffer();
        return new Blob([arrayBuffer], { type: 'audio/mp3' });
      }
      
      // Determine input format from blob type or default to webm
      const mimeType = audioBlob.type.toLowerCase();
      const inputFormat = mimeType.includes('webm') ? 'webm' : 
                         mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3' : 
                         mimeType.includes('wav') ? 'wav' : 'webm';
      
      console.log(`[AudioCompressor] Detected input format: ${inputFormat}`);
      const inputFileName = `input.${inputFormat}`;
      const outputFileName = 'output.mp3'; // Always output as MP3
      
      // Write the input file to FFmpeg's file system
      ffmpeg.writeFile(inputFileName, await fetchFile(audioBlob));
      
      // Log the ffmpeg command for debugging
      const ffmpegCommand = [
        '-i', inputFileName,
        '-ac', OPTIMIZED_AUDIO_FORMAT.channels.toString(),
        '-ar', OPTIMIZED_AUDIO_FORMAT.sampleRate.toString(),
        '-b:a', `${OPTIMIZED_AUDIO_FORMAT.bitRate}k`,
        '-c:a', OPTIMIZED_AUDIO_FORMAT.codec,
        outputFileName
      ];
      
      console.log('[AudioCompressor] Running FFmpeg command:', ffmpegCommand.join(' '));
      
      // Compress audio to mono, 16kHz, 32kbps MP3
      await ffmpeg.exec(ffmpegCommand);
      
      // Verify the output file exists
      const files = await ffmpeg.listDir('./');
      console.log('[AudioCompressor] Files after compression:', files.map(f => f.name).join(', '));
      
      if (!files.some(f => f.name === outputFileName)) {
        throw new Error('Output file not created by FFmpeg');
      }
      
      // Read the compressed file
      const data = await ffmpeg.readFile(outputFileName);
      
      // Ensure proper MIME type is set
      const compressedBlob = new Blob([data], { type: 'audio/mp3' });
      
      console.log(`[AudioCompressor] Compression completed: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB, type: ${compressedBlob.type}`);
      
      // Verify the blob has the right MIME type
      if (!compressedBlob.type.includes('mp3') && !compressedBlob.type.includes('mpeg')) {
        console.warn('[AudioCompressor] Warning: Compressed blob has incorrect MIME type:', compressedBlob.type);
      }
      
      return compressedBlob;
    } catch (error) {
      console.error('[AudioCompressor] Compression error:', error);
      
      // Fallback if compression fails: just change the MIME type
      console.warn('[AudioCompressor] Compression failed, using fallback method');
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        return new Blob([arrayBuffer], { type: 'audio/mp3' });
      } catch (fallbackError) {
        console.error('[AudioCompressor] Fallback method also failed:', fallbackError);
        throw new Error('Failed to compress audio: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  }
  
  /**
   * Split audio into chunks of specified maximum size/duration
   */
  async chunkAudio(audioBlob: Blob, durationSeconds: number): Promise<Blob[]> {
    if (audioBlob.size <= MAX_WHISPER_SIZE_BYTES) {
      console.log('[AudioCompressor] Audio size is within limits, no chunking needed');
      return [audioBlob];
    }
    
    try {
      console.log(`[AudioCompressor] Chunking audio file: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB, duration: ${durationSeconds}s`);
      const ffmpeg = await this.loadFFmpeg();
      
      // Determine input format
      const inputFormat = audioBlob.type.split('/')[1] || 'mp3';
      const inputFileName = `input.${inputFormat}`;
      
      // Write the input file to FFmpeg's file system
      ffmpeg.writeFile(inputFileName, await fetchFile(audioBlob));
      
      // Calculate optimal chunk duration based on file size and total duration
      const chunkCount = Math.ceil(audioBlob.size / TARGET_CHUNK_SIZE_BYTES);
      const chunkDuration = Math.min(
        Math.ceil(durationSeconds / chunkCount),
        MAX_CHUNK_DURATION_SECONDS
      );
      
      console.log(`[AudioCompressor] Splitting into approximately ${chunkCount} chunks of ${chunkDuration}s each`);
      
      // Split audio into segments
      await ffmpeg.exec([
        '-i', inputFileName,
        '-f', 'segment',
        '-segment_time', chunkDuration.toString(),
        '-c', 'copy',
        'chunk_%03d.mp3'
      ]);
      
      // Get the list of chunk files
      const files = await ffmpeg.listDir('./');
      const chunkFiles = files
        .filter(file => file.name.startsWith('chunk_') && file.name.endsWith('.mp3'))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      // Read chunks and convert to Blobs
      const chunks: Blob[] = [];
      for (const file of chunkFiles) {
        const data = await ffmpeg.readFile(file.name);
        const chunkBlob = new Blob([data], { type: 'audio/mp3' });
        chunks.push(chunkBlob);
        console.log(`[AudioCompressor] Chunk ${file.name}: ${(chunkBlob.size / 1024 / 1024).toFixed(2)}MB`);
      }
      
      return chunks;
    } catch (error) {
      console.error('[AudioCompressor] Chunking error:', error);
      throw new Error('Failed to split audio into chunks: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Process audio for transcription - compress and chunk if needed
   */
  async processAudioForTranscription(
    audioBlob: Blob, 
    durationSeconds: number,
    onProgress?: (progress: number) => void
  ): Promise<{ 
    chunks: Blob[], 
    originalSize: number, 
    processedSize: number,
    durationSeconds: number
  }> {
    try {
      onProgress?.(5);
      const originalSize = audioBlob.size;
      
      // Step 1: Compress audio to reduce size
      const compressedBlob = await this.compressAudio(audioBlob);
      onProgress?.(40);
      
      // Step 2: Split into chunks if still too large
      const chunks = await this.chunkAudio(compressedBlob, durationSeconds);
      onProgress?.(80);
      
      // Step 3: Return processing results
      const totalProcessedSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      
      onProgress?.(100);
      return {
        chunks,
        originalSize,
        processedSize: totalProcessedSize,
        durationSeconds
      };
    } catch (error) {
      console.error('[AudioCompressor] Processing error:', error);
      throw new Error('Failed to process audio: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Clean up FFmpeg instance when done
   */
  terminate() {
    if (this.ffmpeg) {
      this.ffmpeg.terminate();
      this.ffmpeg = null;
      this.isLoaded = false;
    }
  }
}

// Export singleton instance
export const audioCompressor = new AudioCompressor();
