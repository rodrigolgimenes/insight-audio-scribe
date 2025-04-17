
import { audioCompressor } from "@/utils/audio/processing/AudioCompressor";

export interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
  index: number;
}

export class ChunkingService {
  // Default chunk size is 15 minutes in milliseconds
  private static readonly DEFAULT_CHUNK_DURATION_MS = 15 * 60 * 1000;
  
  /**
   * Chunks an audio file into smaller segments for processing
   * 
   * @param audioBlob The original audio blob
   * @param durationMs The total duration of the audio in milliseconds
   * @param maxChunkSizeBytes Maximum size per chunk in bytes (defaults to 23MB)
   * @param onProgress Optional progress callback
   * @returns Array of audio chunks
   */
  static async chunkAudio(
    audioBlob: Blob,
    durationMs: number,
    maxChunkSizeBytes: number = 23 * 1024 * 1024,
    onProgress?: (progress: number) => void
  ): Promise<AudioChunk[]> {
    // For now, we'll use a server-side approach since client-side audio chunking is complex
    // But we'll prepare the audio by compressing it first

    // Apply compression to reduce file size
    onProgress?.(10);
    
    const compressedBlob = await audioCompressor.compressAudio(audioBlob, {
      targetBitrate: 32, // 32kbps is optimal for voice
      mono: true,        // Convert to mono for voice
      targetSampleRate: 16000 // 16kHz sample rate (voice optimized)
    });
    
    onProgress?.(30);
    
    // Calculate optimal number of chunks based on compressed size or duration
    const compressedSize = compressedBlob.size;
    const isStillLarge = compressedSize > maxChunkSizeBytes;
    
    if (!isStillLarge) {
      // If the compressed file is under the limit, no need to chunk
      console.log(`Compressed audio is under size limit (${(compressedSize / (1024 * 1024)).toFixed(2)}MB), no chunking needed`);
      return [{
        blob: compressedBlob,
        startTime: 0,
        endTime: durationMs,
        index: 0
      }];
    }
    
    // Calculate number of chunks based on compressed size
    const estimatedChunks = Math.ceil(compressedSize / maxChunkSizeBytes);
    const chunkDurationMs = Math.floor(durationMs / estimatedChunks);
    
    console.log(`Audio needs chunking: ${estimatedChunks} chunks of ~${(chunkDurationMs / 1000 / 60).toFixed(1)} minutes each`);
    
    // In a real implementation, we would split the audio here
    // But for now, we'll return a single chunk and handle the actual chunking server-side
    onProgress?.(100);
    
    return [{
      blob: compressedBlob,
      startTime: 0,
      endTime: durationMs,
      index: 0
    }];
  }
}
