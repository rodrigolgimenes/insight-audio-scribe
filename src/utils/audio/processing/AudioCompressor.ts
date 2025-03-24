
/**
 * Utility class for compressing audio files to optimize storage and transmission
 */
import { logFormat } from "@/lib/logger";

interface AudioCompressionOptions {
  targetBitrate?: number;  // in kbps
  mono?: boolean;          // convert to mono
  targetSampleRate?: number; // in Hz
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
        
        mediaRecorder.onerror = (event) => {
          reject(new Error(`MediaRecorder error: ${event.error}`));
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
