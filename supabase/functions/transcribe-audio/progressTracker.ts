
import { VALID_NOTE_STATUSES } from './constants.ts';

/**
 * Manages note progress updates during transcription
 */
export class ProgressTracker {
  private supabase: any;
  private noteId: string;
  private isChunkedTranscription: boolean;
  private chunkIndex?: number;
  private totalChunks?: number;
  
  constructor(
    supabase: any, 
    noteId: string,
    isChunkedTranscription: boolean = false,
    chunkIndex?: number,
    totalChunks?: number
  ) {
    this.supabase = supabase;
    this.noteId = noteId;
    this.isChunkedTranscription = isChunkedTranscription;
    this.chunkIndex = chunkIndex;
    this.totalChunks = totalChunks;
  }
  
  async updateStatus(status: string, progress: number = 0, errorMessage?: string): Promise<void> {
    if (this.isChunkedTranscription) {
      // For chunked transcription, don't update the main note status to avoid conflicts
      console.log(`[ProgressTracker] Skipping note update for chunk ${this.chunkIndex}`);
      return;
    }
    
    // Validate status is allowed
    if (!VALID_NOTE_STATUSES.includes(status)) {
      console.warn(`[ProgressTracker] Invalid status: ${status}, defaulting to 'processing'`);
      status = 'processing';
    }
    
    try {
      const updateData: any = {
        status,
        processing_progress: Math.max(0, Math.min(100, Math.round(progress)))
      };
      
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }
      
      console.log(`[ProgressTracker] Updating note ${this.noteId} status to ${status} with progress ${progress}%`);
      
      const { error } = await this.supabase
        .from('notes')
        .update(updateData)
        .eq('id', this.noteId);
        
      if (error) {
        console.error('[ProgressTracker] Error updating note status:', error);
      }
    } catch (error) {
      console.error('[ProgressTracker] Exception in updateStatus:', error);
    }
  }
  
  // Mark status as started - 10% progress
  async markStarted(): Promise<void> {
    await this.updateStatus('processing', 10);
  }
  
  // Mark status as downloading - 15% progress
  async markDownloading(): Promise<void> {
    await this.updateStatus('processing', 15);
  }
  
  // Mark status as downloaded - 20% progress
  async markDownloaded(): Promise<void> {
    await this.updateStatus('processing', 20);
  }
  
  // Mark status as processing - 30% progress
  async markProcessing(): Promise<void> {
    await this.updateStatus('processing', 30);
  }
  
  // Mark status as transcribing - 50% progress
  async markTranscribing(): Promise<void> {
    await this.updateStatus('transcribing', 50);
  }
  
  // Mark status as transcribed - 70% progress
  async markTranscribed(): Promise<void> {
    await this.updateStatus('processing', 70);
  }
  
  // Mark status as generating minutes - 80% progress
  async markGeneratingMinutes(): Promise<void> {
    await this.updateStatus('generating_minutes', 80);
  }
  
  // Mark status as completed - 100% progress
  async markCompleted(): Promise<void> {
    await this.updateStatus('completed', 100);
  }
  
  // Mark status as error - 0% progress
  async markError(errorMessage: string): Promise<void> {
    await this.updateStatus('error', 0, errorMessage);
  }
}
