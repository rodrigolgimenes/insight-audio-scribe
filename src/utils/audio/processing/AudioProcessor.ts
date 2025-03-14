
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

/**
 * Class responsible for processing audio and video files
 * Extracts audio from videos and converts to MP3
 */
export class AudioProcessor {
  private ffmpeg: FFmpeg | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  
  /**
   * Initializes FFmpeg for audio processing
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    
    try {
      this.initPromise = this._initializeFFmpeg();
      await this.initPromise;
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('[AudioProcessor] FFmpeg initialized successfully');
    } catch (error) {
      this.isInitializing = false;
      console.error('[AudioProcessor] FFmpeg initialization failed:', error);
      throw new Error('Failed to initialize audio processing capabilities');
    }
  }

  private async _initializeFFmpeg(): Promise<void> {
    try {
      this.ffmpeg = new FFmpeg();
      
      // Try multiple CDN sources to improve reliability
      const sources = [
        'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd',
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/umd',
        'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.12.4/umd'
      ];
      
      let loaded = false;
      let lastError = null;
      
      // Try each source until one works
      for (const baseURL of sources) {
        if (loaded) break;
        
        try {
          console.log(`[AudioProcessor] Attempting to load FFmpeg from: ${baseURL}`);
          await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
          });
          loaded = true;
          console.log(`[AudioProcessor] FFmpeg loaded successfully from ${baseURL}`);
        } catch (error) {
          console.warn(`[AudioProcessor] Failed to load FFmpeg from ${baseURL}:`, error);
          lastError = error;
        }
      }
      
      if (!loaded) {
        throw new Error('Failed to load FFmpeg from all sources: ' + 
          (lastError instanceof Error ? lastError.message : String(lastError)));
      }
    } catch (error) {
      console.error('[AudioProcessor] Error loading FFmpeg:', error);
      throw error;
    }
  }

  /**
   * Processes a file, extracting audio if it's video and converting to MP3
   * @param file File to process
   * @returns Processed MP3 audio file
   */
  async processFile(file: File): Promise<File> {
    console.log(`[AudioProcessor] Processing file: ${file.name} (${file.type})`);
    
    // If already an MP3 audio file, no processing needed
    if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') {
      console.log('[AudioProcessor] File is already MP3, skipping processing');
      return file;
    }
    
    // Initialize FFmpeg if not already done
    if (!this.isInitialized) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('[AudioProcessor] Failed to initialize FFmpeg:', error);
        throw new Error('Audio processing tools initialization failed: ' + error.message);
      }
    }
    
    // Verify FFmpeg is available
    if (!this.ffmpeg) {
      console.error('[AudioProcessor] FFmpeg not available after initialization');
      throw new Error('Audio processing capabilities not available');
    }
    
    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = new Uint8Array(arrayBuffer);
      
      // Set input filename based on type
      const isVideo = file.type.startsWith('video/');
      const inputFileName = isVideo ? 'input.mp4' : 'input.webm';
      const outputFileName = 'output.mp3';
      
      // Write file to FFmpeg's virtual filesystem
      await this.ffmpeg.writeFile(inputFileName, inputBuffer);
      
      console.log(`[AudioProcessor] Converting ${isVideo ? 'video' : 'audio'} to MP3...`);
      
      // Set up commands to extract audio and convert to MP3
      // Use more explicit and reliable command line parameters
      const ffmpegCmd = [
        '-i', inputFileName,
        '-vn',                // Disable video
        '-acodec', 'libmp3lame', // Use MP3 codec
        '-ac', '1',           // Mono channel (helps with speech)
        '-ar', '16000',       // 16kHz sample rate (good for speech)
        '-b:a', '32k',        // 32kbps bitrate (sufficient for speech)
        '-f', 'mp3',          // Force MP3 format output 
        '-y',                 // Overwrite output files without asking
        outputFileName
      ];
      
      // Execute FFmpeg command with timeout handling
      const executePromise = this.ffmpeg.exec(ffmpegCmd);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('FFmpeg conversion timed out after 60 seconds')), 60000);
      });
      
      // Use Promise.race to implement timeout
      await Promise.race([executePromise, timeoutPromise]);
      
      console.log('[AudioProcessor] Conversion completed');
      
      // Verify the output file exists
      const files = await this.ffmpeg.listDir('./');
      const outputExists = files.some(file => file.name === outputFileName);
      
      if (!outputExists) {
        console.error('[AudioProcessor] Output file not created by FFmpeg');
        throw new Error('FFmpeg failed to create output file');
      }
      
      // Read the output file
      const outputData = await this.ffmpeg.readFile(outputFileName);
      
      if (!outputData || outputData.byteLength === 0) {
        console.error('[AudioProcessor] Output file is empty');
        throw new Error('FFmpeg produced an empty output file');
      }
      
      console.log(`[AudioProcessor] Output file read, size: ${outputData.byteLength} bytes`);
      
      // Clean up temporary files
      try {
        await this.ffmpeg.deleteFile(inputFileName);
        await this.ffmpeg.deleteFile(outputFileName);
      } catch (cleanupError) {
        console.warn('[AudioProcessor] Error cleaning up temporary files:', cleanupError);
        // Non-fatal, continue processing
      }
      
      // Create a new File with the processed content
      const processedFileName = file.name.replace(/\.[^/.]+$/, '') + '.mp3';
      const outputFile = new File(
        [outputData], 
        processedFileName, 
        { type: 'audio/mp3' }
      );
      
      console.log(`[AudioProcessor] File processed successfully: ${outputFile.name} (${outputFile.size} bytes)`);
      
      return outputFile;
    } catch (error) {
      console.error('[AudioProcessor] Error processing file:', error);
      // Log stack trace for better debugging
      if (error instanceof Error && error.stack) {
        console.error('[AudioProcessor] Stack trace:', error.stack);
      }
      
      throw new Error(`Failed to process audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Checks if the file needs processing
   * @param file File to check
   * @returns True if the file needs processing
   */
  needsProcessing(file: File): boolean {
    // Process if it's video or non-MP3 audio
    return file.type.startsWith('video/') || 
           (file.type.startsWith('audio/') && file.type !== 'audio/mpeg' && file.type !== 'audio/mp3');
  }
  
  /**
   * Terminates the FFmpeg instance
   */
  terminate(): void {
    if (this.ffmpeg) {
      try {
        this.ffmpeg.terminate();
        this.ffmpeg = null;
        this.isInitialized = false;
        console.log('[AudioProcessor] FFmpeg terminated successfully');
      } catch (error) {
        console.error('[AudioProcessor] Error terminating FFmpeg:', error);
      }
    }
  }
}

// Singleton for use throughout the application
export const audioProcessor = new AudioProcessor();
