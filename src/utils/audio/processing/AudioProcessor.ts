
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

/**
 * Class responsible for processing audio and video files
 * Extracts audio from videos and converts to MP3 with optimal settings for transcription
 */
export class AudioProcessor {
  private ffmpeg: FFmpeg | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private loadingProgress = 0;
  private lastError: Error | null = null;
  
  /**
   * Initializes FFmpeg for audio processing
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.ffmpeg) return;
    if (this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.loadingProgress = 0;
    
    try {
      this.initPromise = this._initializeFFmpeg();
      await this.initPromise;
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('[AudioProcessor] FFmpeg initialized successfully');
    } catch (error) {
      this.isInitializing = false;
      this.lastError = error instanceof Error ? error : new Error(String(error));
      console.error('[AudioProcessor] FFmpeg initialization failed:', error);
      throw new Error(`Failed to initialize audio processing capabilities: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async _initializeFFmpeg(): Promise<void> {
    try {
      // Create new FFmpeg instance
      this.ffmpeg = new FFmpeg();
      
      // Log FFmpeg loading progress
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });
      
      this.ffmpeg.on('progress', ({ progress }) => {
        this.loadingProgress = progress * 100;
        console.log(`[FFmpeg] Loading: ${Math.round(this.loadingProgress)}%`);
      });
      
      // Try multiple CDN sources to improve reliability
      const sources = [
        'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd',
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/umd',
        'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.12.4/umd',
        'https://esm.sh/@ffmpeg/core@0.12.4/dist/umd',
      ];
      
      let loaded = false;
      let loadingErrors = [];
      
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
          loadingErrors.push(`${baseURL}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      if (!loaded) {
        const errorDetails = loadingErrors.join('; ');
        throw new Error(`Failed to load FFmpeg from all sources: ${errorDetails}`);
      }
      
      // Test if FFmpeg is working by running a simple command
      try {
        await this.ffmpeg.exec(['-version']);
        console.log('[AudioProcessor] FFmpeg is working correctly');
      } catch (testError) {
        console.warn('[AudioProcessor] FFmpeg test command failed:', testError);
        // Continue anyway, as some commands might still work
      }
    } catch (error) {
      console.error('[AudioProcessor] Error loading FFmpeg:', error);
      throw error;
    }
  }

  /**
   * Detects file type and determines if it's supported
   * @param file File to check
   * @returns Boolean indicating if file is supported
   */
  isSupportedFileType(file: File): boolean {
    // Check MIME type first
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      return true;
    }
    
    // If MIME type is not recognized, check file extension
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const supportedExtensions = [
      // Audio
      '.mp3', '.wav', '.webm', '.ogg', '.aac', '.m4a', '.flac', 
      // Video
      '.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.3gp', '.m4v'
    ];
    
    return supportedExtensions.includes(fileExtension);
  }

  /**
   * Processes a file, extracting audio if it's video and converting to MP3
   * optimized for transcription (mono, 16kHz, 32kbps)
   * @param file File to process
   * @returns Processed MP3 audio file
   */
  async processFile(file: File): Promise<File> {
    console.log(`[AudioProcessor] Processing file: ${file.name} (${file.type})`);
    
    // Verify file is supported
    if (!this.isSupportedFileType(file)) {
      console.error('[AudioProcessor] Unsupported file type:', file.type);
      throw new Error(`Unsupported file format: ${file.type}`);
    }
    
    // Initialize FFmpeg if not already done
    if (!this.isInitialized || !this.ffmpeg) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('[AudioProcessor] Failed to initialize FFmpeg:', error);
        throw new Error('Audio processing tools initialization failed: ' + 
          (error instanceof Error ? error.message : String(error)));
      }
    }
    
    // Verify FFmpeg is available
    if (!this.ffmpeg) {
      console.error('[AudioProcessor] FFmpeg not available after initialization');
      throw new Error('Audio processing capabilities not available');
    }
    
    try {
      // Determine if file is video or audio
      const isVideo = file.type.startsWith('video/') || 
                     ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.3gp', '.m4v'].some(
                       ext => file.name.toLowerCase().endsWith(ext)
                     );
      
      const isAudio = file.type.startsWith('audio/') || 
                     ['.mp3', '.wav', '.webm', '.ogg', '.aac', '.m4a', '.flac'].some(
                       ext => file.name.toLowerCase().endsWith(ext)
                     );
      
      console.log(`[AudioProcessor] File type detection: isVideo=${isVideo}, isAudio=${isAudio}`);
      
      // Get file extension (for input filename)
      const fileExtension = this.getFileExtension(file);
      
      // Choose appropriate input filename
      let inputFileName: string;
      if (isVideo) {
        inputFileName = `input${fileExtension || '.mp4'}`;
      } else if (isAudio) {
        inputFileName = `input${fileExtension || '.mp3'}`;
      } else {
        // If can't determine from MIME type, use extension from filename
        inputFileName = `input${fileExtension || '.bin'}`;
      }
      
      const outputFileName = 'output.mp3';
      
      // Convert file to ArrayBuffer and write to FFmpeg virtual filesystem
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = new Uint8Array(arrayBuffer);
      
      await this.ffmpeg.writeFile(inputFileName, inputBuffer);
      console.log(`[AudioProcessor] File written to FFmpeg filesystem: ${inputFileName}`);
      
      // Video processing requires special handling
      if (isVideo) {
        console.log('[AudioProcessor] Processing video file to extract audio');
        try {
          // First, check the video file info
          try {
            await this.ffmpeg.exec(['-i', inputFileName]);
          } catch (infoError) {
            // This is expected to throw an error but gives us the file info in console logs
            console.log('[AudioProcessor] Retrieved video file info (ignore error)');
          }
          
          // For MP4 files, try a more reliable approach first
          if (fileExtension === '.mp4' || file.type === 'video/mp4') {
            try {
              // Use a simpler, more reliable command for MP4 files
              await this.ffmpeg.exec([
                '-i', inputFileName,
                '-vn',                // Disable video
                '-acodec', 'libmp3lame', // Use MP3 codec
                '-ac', '1',           // Mono channel
                '-ar', '16000',       // 16kHz sample rate
                '-b:a', '32k',        // 32kbps bitrate
                '-f', 'mp3',          // Force MP3 format
                '-y',                 // Overwrite output files without asking
                outputFileName
              ]);
              console.log('[AudioProcessor] MP4 processing successful with primary method');
            } catch (mp4Error) {
              console.warn('[AudioProcessor] Primary MP4 processing failed, trying fallback method:', mp4Error);
              
              // Fallback to simpler command
              await this.ffmpeg.exec([
                '-i', inputFileName,
                '-vn',                // Disable video
                '-ar', '16000',       // 16kHz sample rate
                '-ac', '1',           // Mono channel
                '-b:a', '32k',        // 32kbps bitrate
                '-f', 'mp3',          // Force output format
                '-y',                 // Overwrite output files without asking
                outputFileName
              ]);
              console.log('[AudioProcessor] MP4 processing successful with fallback method');
            }
          } else {
            // For other video formats
            try {
              await this.ffmpeg.exec([
                '-i', inputFileName,
                '-vn',                // Disable video
                '-acodec', 'libmp3lame', // Use MP3 codec
                '-ac', '1',           // Mono channel
                '-ar', '16000',       // 16kHz sample rate
                '-b:a', '32k',        // 32kbps bitrate
                '-f', 'mp3',          // Force output format
                '-y',                 // Overwrite output files without asking
                outputFileName
              ]);
              console.log('[AudioProcessor] Video processing successful');
            } catch (videoError) {
              console.warn('[AudioProcessor] Video processing failed, trying simplest fallback:', videoError);
              
              // Ultra simple fallback
              await this.ffmpeg.exec([
                '-i', inputFileName,
                '-vn',                // Disable video
                '-f', 'mp3',          // Force MP3 format
                '-y',                 // Overwrite output files without asking
                outputFileName
              ]);
              console.log('[AudioProcessor] Video processing successful with ultra fallback');
            }
          }
        } catch (videoProcessError) {
          console.error('[AudioProcessor] All video processing methods failed:', videoProcessError);
          throw new Error(`Failed to extract audio from video: ${videoProcessError instanceof Error ? videoProcessError.message : String(videoProcessError)}`);
        }
      } else {
        // Audio file processing
        console.log('[AudioProcessor] Processing audio file');
        try {
          await this.ffmpeg.exec([
            '-i', inputFileName,
            '-acodec', 'libmp3lame', // Use MP3 codec
            '-ac', '1',           // Mono channel
            '-ar', '16000',       // 16kHz sample rate
            '-b:a', '32k',        // 32kbps bitrate
            '-f', 'mp3',          // Force MP3 format
            '-y',                 // Overwrite output files without asking
            outputFileName
          ]);
          console.log('[AudioProcessor] Audio processing successful');
        } catch (audioError) {
          console.warn('[AudioProcessor] Audio processing failed, trying fallback:', audioError);
          
          // Try simpler command
          await this.ffmpeg.exec([
            '-i', inputFileName,
            '-f', 'mp3',          // Force MP3 format
            '-y',                 // Overwrite output files without asking
            outputFileName
          ]);
          console.log('[AudioProcessor] Audio processing successful with fallback');
        }
      }
      
      // Verify the output file exists
      const files = await this.ffmpeg.listDir('./');
      const outputExists = files.some(file => file.name === outputFileName);
      
      if (!outputExists) {
        console.error('[AudioProcessor] Output file not created by FFmpeg');
        throw new Error('FFmpeg failed to create output file');
      }
      
      // Read the output file
      const outputData = await this.ffmpeg.readFile(outputFileName);
      
      // Proper type checking to handle possible return types from FFmpeg readFile
      if (!outputData) {
        throw new Error('Failed to read converted audio file');
      }
      
      let outputSize = 0;
      
      // Check the type of outputData and handle accordingly
      if (outputData instanceof Uint8Array) {
        outputSize = outputData.byteLength;
      } else if (typeof outputData === 'string') {
        outputSize = outputData.length;
      } else {
        throw new Error('Unexpected output type from FFmpeg');
      }
      
      if (outputSize === 0) {
        console.error('[AudioProcessor] Output file is empty');
        throw new Error('FFmpeg produced an empty output file');
      }
      
      console.log(`[AudioProcessor] Output file read, size: ${outputSize} bytes`);
      
      // Clean up temporary files
      try {
        await this.ffmpeg.deleteFile(inputFileName);
        await this.ffmpeg.deleteFile(outputFileName);
        console.log('[AudioProcessor] Temporary files cleaned up');
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
      
      // Verify the output file has content
      if (outputFile.size === 0) {
        throw new Error('Processed file is empty. Conversion failed.');
      }
      
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
   * Extract file extension from file name or type
   */
  private getFileExtension(file: File): string {
    // Try to get extension from filename
    const filenameParts = file.name.split('.');
    if (filenameParts.length > 1) {
      return '.' + filenameParts.pop()?.toLowerCase();
    }
    
    // If no extension in filename, derive from MIME type
    if (file.type.startsWith('video/mp4')) return '.mp4';
    if (file.type.startsWith('video/webm')) return '.webm';
    if (file.type.startsWith('video/quicktime')) return '.mov';
    if (file.type.startsWith('video/x-msvideo')) return '.avi';
    if (file.type.startsWith('video/x-matroska')) return '.mkv';
    if (file.type.startsWith('video/')) return '.mp4'; // Default for other videos
    if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') return '.mp3';
    if (file.type === 'audio/wav') return '.wav';
    if (file.type === 'audio/ogg') return '.ogg';
    if (file.type === 'audio/aac') return '.aac';
    if (file.type === 'audio/flac') return '.flac';
    if (file.type === 'audio/x-m4a') return '.m4a';
    if (file.type.startsWith('audio/')) return '.mp3'; // Default for other audio
    
    // Fallback
    return '';
  }
  
  /**
   * Checks if the file needs processing
   * @param file File to check
   * @returns True if the file needs processing
   */
  needsProcessing(file: File): boolean {
    // Process all files to ensure optimal settings for transcription
    return true;
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
  
  /**
   * Gets the current initialization state
   */
  getState(): {
    isInitialized: boolean;
    isInitializing: boolean;
    loadingProgress: number;
    lastError: Error | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      loadingProgress: this.loadingProgress,
      lastError: this.lastError
    };
  }
}

// Singleton for use throughout the application
export const audioProcessor = new AudioProcessor();
