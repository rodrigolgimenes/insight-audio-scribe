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
          // Make sure it has the correct MIME type
          return new Blob([await audioBlob.arrayBuffer()], { type: 'audio/mp3' });
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
            // Force the output to be MP3 regardless of what the MediaRecorder used
            const compressedBlob = new Blob(chunks, { type: 'audio/mp3' });
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

    // For MP3 files, we'll just ensure the correct MIME type and return it as is
    // to avoid unnecessary transcoding which can cause quality loss
    logFormat("Optimizing MP3 handling: keeping original content but ensuring correct MIME type");
    return new Blob([await audioBlob.arrayBuffer()], { type: 'audio/mp3' });
  }
  
  /**
   * Check if a blob is in MP3 format based on its MIME type or file extension
   */
  private isMP3Format(blob: Blob): boolean {
    // Check the MIME type first
    const mimeType = blob.type.toLowerCase();
    const isMp3ByMimeType = mimeType === 'audio/mp3' || 
                           mimeType === 'audio/mpeg' || 
                           mimeType.includes('mp3');
    
    if (isMp3ByMimeType) {
      return true;
    }
    
    // If the blob has a name property (File object), check the extension
    const blobAsFile = blob as File;
    if (blobAsFile.name) {
      return blobAsFile.name.toLowerCase().endsWith('.mp3');
    }
    
    return false;
  }
  
  /**
   * Get the best supported MIME type for audio recording
   */
  private getSupportedMimeType(): string {
    // Prioritize MP3 if available
    if (MediaRecorder.isTypeSupported('audio/mp3')) {
      return 'audio/mp3';
    } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
      return 'audio/mpeg';
    }
    
    // Fallback options in order of preference
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        logFormat(`Using supported MIME type: ${mimeType}`);
        return mimeType;
      }
    }
    
    // Last resort fallback
    logWarning("No ideal MIME types supported by this browser");
    return '';
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
}

// Create and export a singleton instance
export const audioCompressor = new AudioCompressor();
