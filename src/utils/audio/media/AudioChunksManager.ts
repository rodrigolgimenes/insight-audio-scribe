
import { RecordingStats } from '../types';

/**
 * Manages recorded audio chunks and creates the final blob
 */
export class AudioChunksManager {
  private audioChunks: Blob[] = [];
  private mimeType: string = 'audio/webm;codecs=opus';

  /**
   * Adds a new audio chunk
   */
  addChunk(chunk: Blob): void {
    this.audioChunks.push(chunk);
    console.log('[AudioChunksManager] Total chunks:', this.audioChunks.length);
  }

  /**
   * Clears all stored chunks
   */
  clearChunks(): void {
    this.audioChunks = [];
  }

  /**
   * Gets the current chunk count
   */
  getChunkCount(): number {
    return this.audioChunks.length;
  }

  /**
   * Sets the MIME type for the final blob
   */
  setMimeType(mimeType: string): void {
    this.mimeType = mimeType || 'audio/webm;codecs=opus';
  }

  /**
   * Creates a blob from all collected chunks
   */
  getFinalBlob(): Blob {
    return new Blob(this.audioChunks, { 
      type: this.mimeType
    });
  }

  /**
   * Gets recording stats with the provided duration
   */
  getRecordingStats(duration: number): RecordingStats {
    const finalBlob = this.getFinalBlob();
    return {
      blobSize: finalBlob.size,
      duration,
      chunks: this.audioChunks.length,
      mimeType: finalBlob.type
    };
  }
}
