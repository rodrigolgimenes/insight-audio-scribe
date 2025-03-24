
/**
 * Utility class for compressing audio files to optimize storage and transmission
 */
import { logFormat, logError, logSuccess } from "@/lib/logger";

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

    logFormat(`Starting audio compression with bitrate: ${targetBitrate}kbps, mono: ${mono}, sampleRate: ${targetSampleRate}Hz`);
    
    try {
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
        
        // Fix: Use type assertion to handle the error property
        mediaRecorder.onerror = (event: Event) => {
          const mediaRecorderErrorEvent = event as MediaRecorderErrorEvent;
          reject(new Error(`MediaRecorder error: ${mediaRecorderErrorEvent.error}`));
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
      logFormat(`Audio compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
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
      
      // Compress the audio first
      const compressedBlob = await this.compressAudio(audioBlob, {
        targetBitrate: 32,
        mono: true,
        targetSampleRate: 16000
      });
      
      if (onProgress) onProgress(50);
      
      // For large files, we might want to chunk them
      // But for now, just return the compressed blob as a single chunk
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
