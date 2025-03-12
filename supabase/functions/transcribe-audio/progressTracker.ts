
import { updateNoteProgress } from './utils/dataOperations.ts';
import { PROGRESS_STAGES } from './constants.ts';

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
   * Update progress to started stage
   */
  async markStarted() {
    await updateNoteProgress(this.supabase, this.noteId, 'transcribing', PROGRESS_STAGES.STARTED);
  }

  /**
   * Update progress to downloading stage
   */
  async markDownloading() {
    await updateNoteProgress(this.supabase, this.noteId, 'transcribing', PROGRESS_STAGES.DOWNLOADING);
  }

  /**
   * Update progress to downloaded stage
   */
  async markDownloaded() {
    await updateNoteProgress(this.supabase, this.noteId, 'transcribing', PROGRESS_STAGES.DOWNLOADED);
  }

  /**
   * Update progress to processing stage
   */
  async markProcessing() {
    await updateNoteProgress(this.supabase, this.noteId, 'transcribing', PROGRESS_STAGES.PROCESSING);
  }

  /**
   * Update progress to transcribing stage
   */
  async markTranscribing() {
    await updateNoteProgress(this.supabase, this.noteId, 'transcribing', PROGRESS_STAGES.TRANSCRIBING);
  }

  /**
   * Update progress to transcribed stage
   */
  async markTranscribed() {
    await updateNoteProgress(this.supabase, this.noteId, 'transcribing', PROGRESS_STAGES.TRANSCRIBED);
  }

  /**
   * Update progress to generating minutes stage
   */
  async markGeneratingMinutes() {
    await updateNoteProgress(this.supabase, this.noteId, 'generating_minutes', PROGRESS_STAGES.GENERATING_MINUTES);
  }

  /**
   * Update progress to completed stage
   */
  async markCompleted() {
    await updateNoteProgress(this.supabase, this.noteId, 'completed', PROGRESS_STAGES.COMPLETED);
  }

  /**
   * Update progress to error stage
   */
  async markError(errorMessage: string) {
    await updateNoteProgress(this.supabase, this.noteId, 'error', 0);
    
    // Add error message to note
    await this.supabase
      .from('notes')
      .update({ 
        error_message: errorMessage
      })
      .eq('id', this.noteId);
  }
}
