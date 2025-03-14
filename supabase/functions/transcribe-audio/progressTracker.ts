
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
        processing_progress: Math.max(0, Math.min(100, Math.round(progress))),
        updated_at: new Date().toISOString()
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
      } else {
        console.log(`[ProgressTracker] Successfully updated note status to ${status} with progress ${progress}%`);
        
        // Check if we're marking as completed and update the recording if needed
        if (status === 'completed' && progress >= 95) {
          try {
            // Get the recording ID
            const { data: noteData } = await this.supabase
              .from('notes')
              .select('recording_id')
              .eq('id', this.noteId)
              .single();
              
            if (noteData?.recording_id) {
              console.log(`[ProgressTracker] Updating recording ${noteData.recording_id} to completed`);
              
              // Also update timestamps to ensure they're current
              await this.supabase
                .from('recordings')
                .update({ 
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', noteData.recording_id);
                
              // Double-check the update was successful
              const { data: updatedRecording } = await this.supabase
                .from('recordings')
                .select('status')
                .eq('id', noteData.recording_id)
                .single();
                
              console.log(`[ProgressTracker] Recording status after update: ${updatedRecording?.status}`);
            }
          } catch (recordingError) {
            console.error('[ProgressTracker] Error updating recording:', recordingError);
          }
        }
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
    
    // Double-check that the status was actually updated to completed
    try {
      // Wait a short delay to ensure the database has had time to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: noteStatus } = await this.supabase
        .from('notes')
        .select('status, processing_progress')
        .eq('id', this.noteId)
        .single();
        
      if (noteStatus?.status !== 'completed' || noteStatus?.processing_progress !== 100) {
        console.warn('[ProgressTracker] Note not properly marked as completed. Retrying update.');
        
        // Force update to completed
        await this.supabase
          .from('notes')
          .update({
            status: 'completed',
            processing_progress: 100,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.noteId);
      }
    } catch (verifyError) {
      console.error('[ProgressTracker] Error verifying completion status:', verifyError);
    }
  }
  
  // Mark status as error - 0% progress
  async markError(errorMessage: string): Promise<void> {
    await this.updateStatus('error', 0, errorMessage);
  }
}
