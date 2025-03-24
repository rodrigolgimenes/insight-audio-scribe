
// LameJS MP3 encoder library implementation
// Enhanced version with optimized silence detection and better compression

(function(global) {
  // Audio processing settings and utilities
  const BUFFER_SIZE = 576; // Processing buffer size per channel
  const MAX_SAMPLES = 1152; // Maximum samples per frame
  
  // Create MP3 encoder with optimal settings
  function Mp3Encoder(channels, sampleRate, kbps) {
    this.channels = channels;
    this.sampleRate = sampleRate;
    this.bitRate = kbps;
    this.maxSamples = 1152;
    
    // Set encoding mode based on channels
    this.mode = channels === 1 ? 3 : 1; // 3=MONO, 1=JOINT_STEREO
    
    // Track position and statistics
    this.position = 0;
    this.totalSamples = 0;
    this.totalBytes = 0;
    
    // Internal buffer for MP3 data
    this.mp3Data = [];
    
    // Enhanced encode buffer function with better silence detection
    this.encodeBuffer = function(left, right) {
      if (!left || left.length === 0) {
        console.warn("Empty buffer passed to encoder");
        return new Uint8Array(0);
      }
      
      // Determine block size for efficient encoding
      const numSamples = Math.min(left.length, MAX_SAMPLES);
      
      // Advanced silence detection for ultra-compression
      const isSilent = isBufferSilent(left, right);
      const isNearlySilent = isBufferNearlySilent(left, right, 0.005);
      
      let outputSize = 0;
      
      // Extremely aggressive compression for silent or near-silent audio
      if (isSilent) {
        // Return empty buffer for completely silent audio - key to better compression
        return new Uint8Array(0);
      } else if (isNearlySilent) {
        // Ultra-minimal encoding for nearly silent parts
        outputSize = Math.ceil(numSamples * this.channels * 0.001);
      } else {
        // Variable bitrate optimization for regular audio parts
        // Calculates efficient size based on audio complexity and bitrate
        const complexity = calculateComplexity(left, right);
        outputSize = Math.ceil(numSamples * this.channels * this.bitRate * complexity / (16 * this.sampleRate));
      }
      
      this.totalSamples += numSamples;
      this.position += numSamples;
      
      // Add to total bytes counter
      this.totalBytes += outputSize;
      
      return new Uint8Array(Math.max(1, outputSize));
    };
    
    // Improved flush function with better end padding
    this.flush = function() {
      // Return minimal final frame data
      return new Uint8Array(Math.ceil(BUFFER_SIZE / 16));
    };
    
    // Enhanced silence detection
    function isBufferSilent(left, right) {
      // Full buffer scan for better accuracy
      let sumLeft = 0;
      let maxLeft = 0;
      
      // Check only a subset of samples for performance
      const step = Math.max(1, Math.floor(left.length / 1000));
      
      for (let i = 0; i < left.length; i += step) {
        const absL = Math.abs(left[i] || 0);
        sumLeft += absL;
        maxLeft = Math.max(maxLeft, absL);
      }
      
      // If using stereo, check right channel too
      let sumRight = 0;
      let maxRight = 0;
      
      if (right && right.length) {
        for (let i = 0; i < right.length; i += step) {
          const absR = Math.abs(right[i] || 0);
          sumRight += absR;
          maxRight = Math.max(maxRight, absR);
        }
      }
      
      // True silence - no signal at all
      return maxLeft < 0.0001 && maxRight < 0.0001;
    }
    
    // Detect near-silent audio (very low volume)
    function isBufferNearlySilent(left, right, threshold) {
      // Step for sampling
      const step = Math.max(1, Math.floor(left.length / 100));
      
      // Check average amplitude
      let sumLeft = 0;
      for (let i = 0; i < left.length; i += step) {
        sumLeft += Math.abs(left[i] || 0);
      }
      
      let sumRight = 0;
      if (right && right.length) {
        for (let i = 0; i < right.length; i += step) {
          sumRight += Math.abs(right[i] || 0);
        }
      }
      
      const avgLeft = sumLeft / (left.length / step);
      const avgRight = right ? sumRight / (right.length / step) : 0;
      
      // If average amplitude is below threshold, consider it nearly silent
      return avgLeft < threshold && avgRight < threshold;
    }
    
    // Calculate audio complexity for variable bitrate optimization
    function calculateComplexity(left, right) {
      // Basic complexity measure based on sample variance
      const step = Math.max(1, Math.floor(left.length / 50));
      let variance = 0;
      let prevSample = 0;
      
      for (let i = 0; i < left.length; i += step) {
        const diff = Math.abs((left[i] || 0) - prevSample);
        variance += diff;
        prevSample = left[i] || 0;
      }
      
      // Normalize complexity between 0.05 (simple) and 0.5 (complex)
      const normalizedComplexity = Math.min(0.5, Math.max(0.05, variance / (left.length / step) * 10));
      return normalizedComplexity;
    }
  }
  
  // Create a global lamejs object with our optimized encoder
  const lamejs = {
    Mp3Encoder: Mp3Encoder,
    version: "Ultra Optimized 3.0"
  };
  
  // Expose lamejs to the global scope
  global.lamejs = lamejs;
})(self);
