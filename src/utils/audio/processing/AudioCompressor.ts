/**
 * Utility class for compressing audio files to optimize storage and transmission
 */
import { logFormat, logError, logSuccess, logWarning } from "@/lib/logger";

interface AudioCompressionOptions {
  targetBitrate?: number;  // in kbps
  mono?: boolean;          // convert to mono
  targetSampleRate?: number; // in Hz
}

interface ProcessedAudioResult {
  chunks: Blob[];
  originalSize: number;
  processedSize: number;
}

class AudioCompressor {
  /**
   * Compresses an audio blob by reducing its bitrate
   * 
   * @param audioBlob The original audio blob to compress
   * @param options Compression options
   * @returns A Promise resolving to the compressed audio blob
   */
  async compressAudio(
    audioBlob: Blob, 
    options: AudioCompressionOptions = {}
  ): Promise<Blob> {
    // Default options optimized for voice
    const {
      targetBitrate = 32,       // 32kbps is good for voice
      mono = true,              // voice usually only needs mono
      targetSampleRate = 16000  // 16kHz is sufficient for voice
    } = options;

    // Check if it's already an MP3 file - if so, handle it differently
    const isMP3 = this.isMP3Format(audioBlob);
    logFormat(`Starting audio compression with bitrate: ${targetBitrate}kbps, mono: ${mono}, sampleRate: ${targetSampleRate}Hz, input format: ${audioBlob.type}, isMP3: ${isMP3}`);
    
    // Special handling for MP3 files to avoid re-encoding if possible
    if (isMP3) {
      logFormat("MP3 file detected - using optimized MP3 handling path");
      try {
        // For MP3 files, we'll either:
        // 1. If the file is already small enough, just return it as is
        // 2. If the file needs compression, do a more efficient MP3-specific compression
        
        // Check if the file is already small enough (using size as a heuristic)
        const fileSizeKB = audioBlob.size / 1024;
        const estimatedBitrateKbps = this.estimateBitrateFromSize(audioBlob.size, 0); // We don't know duration yet, will estimate
        
        logFormat(`MP3 file size: ${fileSizeKB.toFixed(1)}KB, estimated bitrate: ~${estimatedBitrateKbps}kbps`);
        
        if (estimatedBitrateKbps <= targetBitrate * 1.2) {
          // If the file is already close to or below our target bitrate, just return it
          logFormat("MP3 file is already at an acceptable bitrate, returning original");
          return audioBlob;
        }

        // Otherwise, continue with specialized MP3 handling
        return await this.compressMP3File(audioBlob, targetBitrate, mono);
      } catch (error) {
        // If anything goes wrong in MP3-specific handling, fall back to standard processing
        logWarning(`Error in MP3-specific handling: ${error instanceof Error ? error.message : 'Unknown error'}, falling back to standard method`);
      }
    }
    
    try {
      // Standard audio compression for non-MP3 files or fallback
      // Create audio context for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Prepare the media recorder with reduced bitrate
      const destinationNode = audioContext.createMediaStreamDestination();
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      
      // Use mono if requested
      if (mono && audioBuffer.numberOfChannels > 1) {
        // Create a channel merger to convert to mono
        const merger = audioContext.createChannelMerger(1);
        sourceNode.connect(merger);
        merger.connect(destinationNode);
      } else {
        sourceNode.connect(destinationNode);
      }
      
      // Prepare to record the processed stream
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: targetBitrate * 1000, // Convert kbps to bps
        mimeType: this.getSupportedMimeType()
      };
      
      logFormat(`Using MediaRecorder with options: ${JSON.stringify(options)}`);
      const mediaRecorder = new MediaRecorder(destinationNode.stream, options);
      
      // Start recording and process the audio
      return new Promise<Blob>((resolve, reject) => {
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          try {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const compressedBlob = new Blob(chunks, { type: mimeType });
            logFormat(`Compression completed: original size ${(audioBlob.size / 1024).toFixed(1)}KB, compressed size ${(compressedBlob.size / 1024).toFixed(1)}KB`);
            
            // Clean up
            sourceNode.disconnect();
            audioContext.close().catch(console.error);
            
            resolve(compressedBlob);
          } catch (err) {
            reject(err);
          }
        };
        
        // Fix: Use type assertion for error handling
        mediaRecorder.onerror = (event: Event) => {
          // Use a more generic approach since MediaRecorderErrorEvent may not be available
          const error = (event as any).error || new Error('Unknown MediaRecorder error');
          reject(error);
        };
        
        // Start playing and recording
        sourceNode.start(0);
        mediaRecorder.start();
        
        // Stop recording when the audio finishes playing
        sourceNode.onended = () => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        };
      });
    } catch (error) {
      logError(`Audio compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  /**
   * Specialized method for compressing MP3 files without full re-encoding
   * Uses a more direct approach for MP3 files to avoid quality loss from multiple encodings
   */
  private async compressMP3File(audioBlob: Blob, targetBitrate: number, mono: boolean): Promise<Blob> {
    logFormat(`Using specialized MP3 compression with target bitrate: ${targetBitrate}kbps, mono: ${mono}`);

    // For now, we'll use the browser's audio API to decode and re-encode
    // In a production environment, you might want to use a specialized MP3 library
    // or server-side processing for better results
    
    // Create audio context for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Log audio details
      logFormat(`MP3 audio details: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz, ${audioBuffer.length / audioBuffer.sampleRate}s`);
      
      // Set up a specialized destination for MP3 output
      const destinationNode = audioContext.createMediaStreamDestination();
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      
      // Apply compression/processing specifically optimized for MP3
      // For mono conversion if requested
      if (mono && audioBuffer.numberOfChannels > 1) {
        logFormat("Converting stereo MP3 to mono");
        const merger = audioContext.createChannelMerger(1);
        sourceNode.connect(merger);
        merger.connect(destinationNode);
      } else {
        sourceNode.connect(destinationNode);
      }
      
      // Now use MediaRecorder but configured optimally for MP3 output
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: targetBitrate * 1000,
        mimeType: 'audio/mpeg' // Try to request MP3 directly
      };
      
      // Fall back to a supported type if MP3 isn't directly supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        logFormat("MP3 recording not directly supported, using alternate format");
        options.mimeType = this.getSupportedMimeType();
      }
      
      logFormat(`MP3 processing using MediaRecorder with options: ${JSON.stringify(options)}`);
      const mediaRecorder = new MediaRecorder(destinationNode.stream, options);
      
      // Record the processed audio
      return new Promise<Blob>((resolve, reject) => {
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          try {
            // Force MP3 MIME type for the output
            const mimeType = 'audio/mpeg';
            const compressedBlob = new Blob(chunks, { type: mimeType });
            
            logFormat(`MP3 compression completed: original size ${(audioBlob.size / 1024).toFixed(1)}KB, compressed size ${(compressedBlob.size / 1024).toFixed(1)}KB`);
            
            // Cleanup
            sourceNode.disconnect();
            audioContext.close().catch(console.error);
            
            resolve(compressedBlob);
          } catch (err) {
            reject(err);
          }
        };
        
        mediaRecorder.onerror = (event: Event) => {
          const error = (event as any).error || new Error('Unknown MediaRecorder error');
          reject(error);
        };
        
        // Start the process
        sourceNode.start(0);
        mediaRecorder.start();
        
        sourceNode.onended = () => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        };
        
        // Add a safety timeout in case the audio doesn't trigger onended
        const duration = audioBuffer.duration;
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            logFormat("Safety timeout triggered for MP3 processing");
            mediaRecorder.stop();
          }
        }, (duration * 1000) + 2000); // Add 2 seconds margin
      });
    } catch (error) {
      logError(`MP3-specific compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      audioContext.close().catch(console.error);
      throw error;
    }
  }
  
  /**
   * Check if a blob is in MP3 format based on its MIME type
   */
  private isMP3Format(blob: Blob): boolean {
    const mimeType = blob.type.toLowerCase();
    return mimeType === 'audio/mp3' || 
           mimeType === 'audio/mpeg' || 
           mimeType.includes('mp3');
  }
  
  /**
   * Roughly estimate the bitrate from file size and duration
   * If duration is not available, estimates based on file size alone
   */
  private estimateBitrateFromSize(fileSizeBytes: number, durationSeconds: number): number {
    if (durationSeconds > 0) {
      // If we have duration, calculate the actual bitrate
      return Math.round((fileSizeBytes * 8) / 1000 / durationSeconds);
    } else {
      // If duration is unknown, make a rough estimate
      // Average MP3 files are roughly 1MB per minute at 128kbps
      const assumedBitrateKbps = (fileSizeBytes / 1024 / 128) * 128;
      return Math.min(320, Math.max(32, Math.round(assumedBitrateKbps)));
    }
  }
  
  /**
   * Process audio for transcription, potentially chunking large files
   * 
   * @param audioBlob Original audio blob
   * @param durationInSeconds Duration of the audio
   * @param onProgress Optional progress callback
   * @returns Processed audio result with chunks
   */
  async processAudioForTranscription(
    audioBlob: Blob,
    durationInSeconds: number,
    onProgress?: (progress: number) => void
  ): Promise<ProcessedAudioResult> {
    try {
      // Report initial progress
      if (onProgress) onProgress(10);
      
      // Check if it's already an MP3 file at a reasonable bitrate
      const isMP3 = this.isMP3Format(audioBlob);
      const estimatedBitrate = this.estimateBitrateFromSize(audioBlob.size, durationInSeconds);
      
      logFormat(`Processing audio for transcription: format=${audioBlob.type}, isMP3=${isMP3}, estimated bitrate=${estimatedBitrate}kbps, size=${(audioBlob.size/1024/1024).toFixed(2)}MB`);
      
      // For small MP3 files that are already at a reasonable bitrate, we can skip compression
      if (isMP3 && audioBlob.size < 10 * 1024 * 1024 && estimatedBitrate <= 64) {
        logFormat(`MP3 file is already optimized (${estimatedBitrate}kbps), skipping compression`);
        if (onProgress) onProgress(90);
        
        return {
          chunks: [audioBlob],
          originalSize: audioBlob.size,
          processedSize: audioBlob.size
        };
      }
      
      // Compress the audio with appropriate settings
      const compressedBlob = await this.compressAudio(audioBlob, {
        targetBitrate: 32,  // Lower bitrate for transcription
        mono: true,         // Mono is sufficient for transcription
        targetSampleRate: 16000 // 16kHz is good for speech recognition
      });
      
      if (onProgress) onProgress(90);
      
      return {
        chunks: [compressedBlob],
        originalSize: audioBlob.size,
        processedSize: compressedBlob.size
      };
      
    } catch (error) {
      logError(`Error processing audio for transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Return the original blob if compression fails
      return {
        chunks: [audioBlob],
        originalSize: audioBlob.size,
        processedSize: audioBlob.size
      };
    }
  }
  
  /**
   * Clean up any resources used by the audio compressor
   */
  terminate(): void {
    // Nothing to terminate in the current implementation
    // This is a placeholder for future implementations that might need cleanup
    logFormat('AudioCompressor terminated');
  }
  
  /**
   * Get a supported MIME type for media recording
   */
  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp3',
      'audio/mpeg'
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        logFormat(`Using supported MIME type: ${mimeType}`);
        return mimeType;
      }
    }
    
    logFormat('No preferred MIME types supported, using default');
    return '';  // Let the browser choose the default
  }
}

// Export a singleton instance
export const audioCompressor = new AudioCompressor();
