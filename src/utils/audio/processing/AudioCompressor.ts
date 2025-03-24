import { log } from '@/lib/logger';

class AudioCompressor {
  /**
   * Compresses audio from any source to MP3 format with optimized settings for voice
   * @param sourceBlob - The source audio blob (any format)
   * @param options - Compression options
   * @returns Promise with compressed MP3 blob
   */
  async compressAudio(
    sourceBlob: Blob,
    options: {
      targetBitrate?: number; // kbps
      mono?: boolean;
      targetSampleRate?: number;
    } = {}
  ): Promise<Blob> {
    const start = performance.now();
    log('AudioCompressor: Starting compression');
    
    // Default options optimized for voice recordings
    const bitrate = options.targetBitrate || 32; // 32kbps is good for voice
    const mono = options.mono !== undefined ? options.mono : true; // Default to mono for voice
    const targetSampleRate = options.targetSampleRate || 16000; // 16kHz is sufficient for voice
    
    try {
      // Track original size for reporting compression ratio
      const originalSize = sourceBlob.size;
      log(`AudioCompressor: Original size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
      
      // 1. Convert source blob to AudioBuffer for processing
      const audioBuffer = await this.blobToAudioBuffer(sourceBlob);
      
      // 2. Apply audio processing (convert to mono, resample if needed)
      const processedBuffer = await this.processAudioBuffer(audioBuffer, {
        mono,
        targetSampleRate,
      });
      
      // 3. Convert processed buffer to MP3 with specified bitrate
      const mp3Blob = await this.convertToMp3(processedBuffer, bitrate);
      
      // Report compression results
      const compressedSize = mp3Blob.size;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
      const duration = (performance.now() - start).toFixed(2);
      
      log(`AudioCompressor: Compression complete in ${duration}ms`);
      log(`AudioCompressor: Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`);
      
      return mp3Blob;
    } catch (error) {
      log(`AudioCompressor: Compression failed: ${error instanceof Error ? error.message : String(error)}`);
      // Return original blob if compression fails
      return sourceBlob;
    }
  }
  
  /**
   * Converts a blob to an AudioBuffer for processing
   */
  private async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    log('AudioCompressor: Converting blob to AudioBuffer');
    
    return new Promise((resolve, reject) => {
      // Create file reader to get array buffer from blob
      const fileReader = new FileReader();
      
      fileReader.onload = async () => {
        try {
          // Create audio context
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContext();
          
          // Decode audio data
          const arrayBuffer = fileReader.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          log(`AudioCompressor: Decoded audio - ${audioBuffer.numberOfChannels} channels, ` +
              `${audioBuffer.sampleRate}Hz, ${audioBuffer.length} samples ` +
              `(${(audioBuffer.duration).toFixed(2)} seconds)`);
          
          resolve(audioBuffer);
        } catch (error) {
          reject(new Error(`Failed to decode audio data: ${error instanceof Error ? error.message : String(error)}`));
        }
      };
      
      fileReader.onerror = () => {
        reject(new Error('Failed to read audio file'));
      };
      
      // Read blob as array buffer
      fileReader.readAsArrayBuffer(blob);
    });
  }
  
  /**
   * Process AudioBuffer (convert to mono, resample)
   */
  private async processAudioBuffer(
    audioBuffer: AudioBuffer, 
    options: {
      mono?: boolean;
      targetSampleRate?: number;
    }
  ): Promise<AudioBuffer> {
    const { mono = true, targetSampleRate } = options;
    log(`AudioCompressor: Processing audio buffer - ${mono ? 'converting to mono' : 'keeping channels'}, ` +
        `${targetSampleRate ? `resampling to ${targetSampleRate}Hz` : 'keeping original sample rate'}`);
    
    // Create output context with target sample rate if specified
    const outputSampleRate = targetSampleRate || audioBuffer.sampleRate;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const outputContext = new AudioContext({ sampleRate: outputSampleRate });
    
    // Get the number of channels to process
    const numChannels = mono ? 1 : audioBuffer.numberOfChannels;
    
    // Calculate output length (accounting for potential sample rate change)
    const outputLength = Math.floor(audioBuffer.length * outputSampleRate / audioBuffer.sampleRate);
    
    // Create output buffer
    const outputBuffer = outputContext.createBuffer(numChannels, outputLength, outputSampleRate);
    
    if (mono && audioBuffer.numberOfChannels > 1) {
      // Convert to mono by averaging all channels
      const outputData = outputBuffer.getChannelData(0);
      
      // Mix down all channels
      for (let sample = 0; sample < outputLength; sample++) {
        // Calculate the corresponding position in the source buffer
        const srcPos = Math.floor(sample * audioBuffer.sampleRate / outputSampleRate);
        
        // Initialize accumulator for averaging
        let sum = 0;
        
        // Sum all channels
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          if (srcPos < channelData.length) {
            sum += channelData[srcPos];
          }
        }
        
        // Average and assign to mono output
        outputData[sample] = sum / audioBuffer.numberOfChannels;
      }
    } else {
      // Keep multi-channel or already mono, but handle resampling if needed
      const channelCount = Math.min(numChannels, audioBuffer.numberOfChannels);
      
      for (let channel = 0; channel < channelCount; channel++) {
        const outputData = outputBuffer.getChannelData(channel);
        const inputData = audioBuffer.getChannelData(channel);
        
        // Simple resampling by linear interpolation
        for (let sample = 0; sample < outputLength; sample++) {
          const srcPos = sample * audioBuffer.sampleRate / outputSampleRate;
          const srcIndex = Math.floor(srcPos);
          const fraction = srcPos - srcIndex;
          
          // Linear interpolation between samples
          if (srcIndex + 1 < inputData.length) {
            outputData[sample] = inputData[srcIndex] * (1 - fraction) + inputData[srcIndex + 1] * fraction;
          } else if (srcIndex < inputData.length) {
            outputData[sample] = inputData[srcIndex];
          }
        }
      }
    }
    
    log(`AudioCompressor: Processed to ${outputBuffer.numberOfChannels} channels, ` +
        `${outputBuffer.sampleRate}Hz, ${outputBuffer.length} samples`);
    
    return outputBuffer;
  }
  
  /**
   * Convert AudioBuffer to MP3
   */
  private async convertToMp3(audioBuffer: AudioBuffer, bitrate: number = 32): Promise<Blob> {
    log(`AudioCompressor: Converting to MP3 at ${bitrate}kbps`);
    
    // First, convert to WAV as an intermediate format
    const wavBlob = await this.audioBufferToWav(audioBuffer);
    log(`AudioCompressor: Intermediate WAV size: ${(wavBlob.size / 1024 / 1024).toFixed(2)}MB`);
    
    // Create a worker to handle MP3 encoding
    const workerCode = `
      // Import lamejs library
      importScripts('/libs/lamejs/lame.all.js');
      
      self.onmessage = async function(e) {
        try {
          const { wavArrayBuffer, channels, sampleRate, bitrate } = e.data;
          
          // Parse WAV data
          const wavDataView = new DataView(wavArrayBuffer);
          
          // Extract WAV format information
          const numChannels = wavDataView.getUint16(22, true);
          const sampleRate = wavDataView.getUint32(24, true);
          const bitsPerSample = wavDataView.getUint16(34, true);
          
          // Find the data chunk
          let dataStart = 0;
          for (let i = 44; i < wavDataView.byteLength - 4; i++) {
            if (wavDataView.getUint32(i, false) === 0x64617461) { // "data" in ASCII
              dataStart = i + 8; // skip "data" + size
              break;
            }
          }
          
          if (dataStart === 0) {
            throw new Error("Could not find WAV data chunk");
          }
          
          // Create MP3 encoder
          const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate);
          
          // Extract PCM samples
          const dataLength = wavDataView.byteLength - dataStart;
          const samplesPerChannel = dataLength / (numChannels * (bitsPerSample / 8));
          
          // Create sample buffers
          const left = new Int16Array(samplesPerChannel);
          const right = numChannels > 1 ? new Int16Array(samplesPerChannel) : null;
          
          // Extract samples from WAV
          for (let i = 0; i < samplesPerChannel; i++) {
            const sampleOffset = dataStart + i * numChannels * (bitsPerSample / 8);
            
            // Get left/mono channel
            left[i] = wavDataView.getInt16(sampleOffset, true);
            
            // Get right channel if stereo
            if (numChannels > 1 && right) {
              right[i] = wavDataView.getInt16(sampleOffset + 2, true);
            }
          }
          
          // Process in chunks for better memory usage
          const mp3Data = [];
          const blockSize = 1152; // MP3 frame size
          const numBlocks = Math.ceil(samplesPerChannel / blockSize);
          
          // Encode each block
          for (let block = 0; block < numBlocks; block++) {
            // Report progress
            if (block % 10 === 0) {
              self.postMessage({ 
                type: 'progress', 
                progress: Math.round((block / numBlocks) * 100) 
              });
            }
            
            const offset = block * blockSize;
            const count = Math.min(blockSize, samplesPerChannel - offset);
            
            // Create block buffers
            const blockLeft = new Int16Array(blockSize);
            const blockRight = numChannels > 1 ? new Int16Array(blockSize) : null;
            
            // Fill with zeros first
            blockLeft.fill(0);
            if (blockRight) blockRight.fill(0);
            
            // Copy actual samples
            for (let i = 0; i < count; i++) {
              if (offset + i < left.length) {
                blockLeft[i] = left[offset + i];
              }
              
              if (numChannels > 1 && blockRight && offset + i < right.length) {
                blockRight[i] = right[offset + i];
              }
            }
            
            // Encode block
            let mp3Block;
            if (numChannels > 1 && blockRight) {
              mp3Block = mp3encoder.encodeBuffer(blockLeft, blockRight);
            } else {
              mp3Block = mp3encoder.encodeBuffer(blockLeft);
            }
            
            if (mp3Block && mp3Block.length > 0) {
              mp3Data.push(mp3Block);
            }
          }
          
          // Finalize encoding
          const finalMp3 = mp3encoder.flush();
          if (finalMp3 && finalMp3.length > 0) {
            mp3Data.push(finalMp3);
          }
          
          // Combine all MP3 data chunks
          let totalLength = 0;
          mp3Data.forEach(buffer => {
            totalLength += buffer.length;
          });
          
          const mp3Buffer = new Uint8Array(totalLength);
          let offset = 0;
          
          mp3Data.forEach(buffer => {
            mp3Buffer.set(buffer, offset);
            offset += buffer.length;
          });
          
          // Send back the result
          self.postMessage({ 
            type: 'complete', 
            mp3Buffer: mp3Buffer.buffer
          }, [mp3Buffer.buffer]);
        } catch (error) {
          self.postMessage({ 
            type: 'error', 
            message: error.message || 'MP3 encoding failed'
          });
        }
      };
    `;
    
    // Create worker from blob
    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    
    // Convert WAV blob to array buffer
    const wavArrayBuffer = await wavBlob.arrayBuffer();
    
    return new Promise((resolve, reject) => {
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        reject(new Error('MP3 encoding timed out after 60 seconds'));
      }, 60000);
      
      // Handle messages from worker
      worker.onmessage = (e) => {
        const data = e.data;
        
        if (data.type === 'progress') {
          log(`AudioCompressor: MP3 encoding progress: ${data.progress}%`);
        } 
        else if (data.type === 'complete') {
          // Clear timeout and clean up
          clearTimeout(timeout);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          
          // Create MP3 blob from buffer
          const mp3Blob = new Blob([data.mp3Buffer], { type: 'audio/mp3' });
          log(`AudioCompressor: MP3 encoding complete, size: ${(mp3Blob.size / 1024 / 1024).toFixed(2)}MB`);
          
          resolve(mp3Blob);
        } 
        else if (data.type === 'error') {
          // Clear timeout and clean up
          clearTimeout(timeout);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          
          reject(new Error(`MP3 encoding failed: ${data.message}`));
        }
      };
      
      // Handle worker errors
      worker.onerror = (error) => {
        clearTimeout(timeout);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        
        reject(new Error(`Worker error: ${error.message}`));
      };
      
      // Send WAV data to worker for MP3 encoding
      worker.postMessage({
        wavArrayBuffer,
        channels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
        bitrate
      }, [wavArrayBuffer]);
    });
  }
  
  /**
   * Convert AudioBuffer to WAV blob (intermediate step)
   */
  private async audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Create buffer with WAV header
    const buffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(buffer);
    
    // Write WAV header
    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + length * numChannels * 2, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // Format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (raw)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * 2, true);
    // Block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    this.writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, length * numChannels * 2, true);
    
    // Write interleaved audio data
    const offset = 44;
    
    if (numChannels === 1) {
      // Mono - simpler encoding
      const channel = audioBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        // Convert float to 16-bit and write
        const sample = Math.max(-1, Math.min(1, channel[i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + i * 2, value, true);
      }
    } else {
      // Multi-channel - interleaving required
      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
          const data = audioBuffer.getChannelData(channel);
          const sample = Math.max(-1, Math.min(1, data[i]));
          const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          view.setInt16(offset + (i * numChannels + channel) * 2, value, true);
        }
      }
    }
    
    // Return WAV as blob
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  /**
   * Utility function to write a string to a DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

// Create and export a singleton instance
export const audioCompressor = new AudioCompressor();
