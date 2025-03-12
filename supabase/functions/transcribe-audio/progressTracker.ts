
import { updateNoteProgress } from './utils/dataOperations.ts';
import { PROGRESS_STAGES, VALID_NOTE_STATUSES } from './constants.ts';

/**
 * A class to handle tracking transcription progress
 */
export class ProgressTracker {
  private supabase: any;
  private noteId: string;

  constructor(supabase: any, noteId: string) {
    this.supabase = supabase;
    this.noteId = noteId;
  }

  /**
   * Validates that a status is among the allowed values
   * @param status Status to validate
   * @returns Whether the status is valid
   */
  private validateStatus(status: string): string {
    if (!VALID_NOTE_STATUSES.includes(status)) {
      console.error(`[transcribe-audio] Invalid status requested: ${status}. Using 'processing' instead.`);
      return 'processing'; // Fallback to a safe default value
    }
    return status;
  }

  /**
   * Update progress to started stage
   */
  async markStarted() {
    const status = this.validateStatus('processing');
    await updateNoteProgress(this.supabase, this.noteId, status, PROGRESS_STAGES.STARTED);
  }

  /**
   * Update progress to downloading stage
   */
  async markDownloading() {
    const status = this.validateStatus('processing');
    await updateNoteProgress(this.supabase, this.noteId, status, PROGRESS_STAGES.DOWNLOADING);
  }

  /**
   * Update progress to downloaded stage
   */
  async markDownloaded() {
    const status = this.validateStatus('processing');
    await updateNoteProgress(this.supabase, this.noteId, status, PROGRESS_STAGES.DOWNLOADED);
  }

  /**
   * Update progress to processing stage
   */
  async markProcessing() {
    const status = this.validateStatus('processing');
    await updateNoteProgress(this.supabase, this.noteId, status, PROGRESS_STAGES.PROCESSING);
  }

  /**
   * Update progress to transcribing stage
   */
  async markTranscribing() {
    const status = this.validateStatus('transcribing');
    await updateNoteProgress(this.supabase, this.noteId, status, PROGRESS_STAGES.TRANSCRIBING);
  }

  /**
   * Update progress to transcribed stage
   */
  async markTranscribed() {
    const status = this.validateStatus('transcribed');
    await updateNoteProgress(this.supabase, this.noteId, status, PROGRESS_STAGES.TRANSCRIBED);
  }

  /**
   * Update progress to generating minutes stage
   */
  async markGeneratingMinutes() {
    const status = this.validateStatus('generating_minutes');
    await updateNoteProgress(this.supabase, this.noteId, status, PROGRESS_STAGES.GENERATING_MINUTES);
  }

  /**
   * Update progress to completed stage
   */
  async markCompleted() {
    const status = this.validateStatus('completed');
    await updateNoteProgress(this.supabase, this.noteId, status, PROGRESS_STAGES.COMPLETED);
  }

  /**
   * Update progress to error stage
   */
  async markError(errorMessage: string) {
    const status = this.validateStatus('error');
    await updateNoteProgress(this.supabase, this.noteId, status, 0);
    
    // Add error message to note
    await this.supabase
      .from('notes')
      .update({ 
        error_message: errorMessage
      })
      .eq('id', this.noteId);
  }
}
