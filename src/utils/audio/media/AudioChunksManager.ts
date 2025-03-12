
import { RecordingStats } from '../types/audioRecorderTypes';

export class AudioChunksManager {
  private audioChunks: Blob[] = [];
  private mimeType: string = '';

  addChunk(chunk: Blob): void {
    this.audioChunks.push(chunk);
    console.log('[AudioChunksManager] Total chunks:', this.audioChunks.length);
  }

  clearChunks(): void {
    this.audioChunks = [];
  }

  getChunks(): Blob[] {
    return this.audioChunks;
  }

  getChunkCount(): number {
    return this.audioChunks.length;
  }

  setMimeType(mimeType: string): void {
    this.mimeType = mimeType || 'audio/webm';
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getFinalBlob(): Blob | null {
    if (this.audioChunks.length === 0) return null;
    
    return new Blob(this.audioChunks, { 
      type: this.mimeType || 'audio/webm' 
    });
  }

  getRecordingStats(duration: number): RecordingStats {
    const finalBlob = this.getFinalBlob();
    if (!finalBlob) {
      return {
        blobSize: 0,
        duration,
        chunks: 0,
        mimeType: this.mimeType
      };
    }
    
    return {
      blobSize: finalBlob.size,
      duration,
      chunks: this.audioChunks.length,
      mimeType: finalBlob.type
    };
  }
}
